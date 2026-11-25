export const FAVICON_COLORS = ['yellow', 'coral', 'cyan', 'mint', 'purple'] as const;
export type FaviconColor = (typeof FAVICON_COLORS)[number];

interface TabLease {
  color: FaviconColor;
  createdAt: number;
  updatedAt: number;
}

type Registry = Record<string, TabLease>;

type ChannelMessage =
  | { type: 'claim'; instanceId: string; color: FaviconColor; createdAt: number }
  | { type: 'release'; instanceId: string }
  | { type: 'ping' };

const STORAGE_KEY = 'jugnu:tab-favicons';
const SESSION_COLOR_KEY = 'jugnu:tab-favicon-color';
const CHANNEL_NAME = 'jugnu:tab-favicon';
const HEARTBEAT_MS = 30_000;
const STALE_MS = 180_000;

let activeCleanup: (() => void) | null = null;

function makeInstanceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isFaviconColor(value: unknown): value is FaviconColor {
  return typeof value === 'string' && (FAVICON_COLORS as readonly string[]).includes(value);
}

function readRegistry(now: number): Registry {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return {};

    const clean: Registry = {};
    for (const [id, entry] of Object.entries(parsed)) {
      if (!entry || typeof entry !== 'object') continue;
      const candidate = entry as Partial<TabLease>;
      if (
        isFaviconColor(candidate.color) &&
        typeof candidate.updatedAt === 'number' &&
        now - candidate.updatedAt < STALE_MS
      ) {
        clean[id] = {
          color: candidate.color,
          createdAt: typeof candidate.createdAt === 'number' ? candidate.createdAt : candidate.updatedAt,
          updatedAt: candidate.updatedAt,
        };
      }
    }
    return clean;
  } catch {
    return {};
  }
}

function writeRegistry(registry: Registry): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  } catch {
    // Ignore storage quota or private mode restrictions.
  }
}

function readSessionColor(): FaviconColor | null {
  try {
    const value = window.sessionStorage.getItem(SESSION_COLOR_KEY);
    return isFaviconColor(value) ? value : null;
  } catch {
    return null;
  }
}

function writeSessionColor(color: FaviconColor): void {
  try {
    window.sessionStorage.setItem(SESSION_COLOR_KEY, color);
  } catch {
    // Ignore restricted sessionStorage.
  }
}

function pickBestColor(
  registry: Registry,
  selfId: string,
  preferred: FaviconColor | null,
): FaviconColor {
  const counts: Record<FaviconColor, number> = {
    yellow: 0,
    coral: 0,
    cyan: 0,
    mint: 0,
    purple: 0,
  };

  for (const [id, lease] of Object.entries(registry)) {
    if (id !== selfId) counts[lease.color] += 1;
  }

  // Keep a tab's own color across F5 reloads as long as no other live tab holds it.
  if (preferred && counts[preferred] === 0) {
    return preferred;
  }

  let bestColor: FaviconColor = FAVICON_COLORS[0];
  let minCount = counts[bestColor];
  for (const color of FAVICON_COLORS) {
    if (counts[color] < minCount) {
      bestColor = color;
      minCount = counts[color];
    }
  }
  return bestColor;
}

function applyFaviconLinks(color: FaviconColor): void {
  const head = document.head;
  if (!head) return;

  const existing = Array.from(head.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'));
  for (const link of existing) {
    if (!link.dataset.tabFavicon) {
      link.remove();
    }
  }

  const desiredSpecs = [
    { sizes: '32x32', href: `/Favicon/favicon/${color}/32.svg` },
    { sizes: '16x16', href: `/Favicon/favicon/${color}/16-1.svg` },
  ];

  const managed = Array.from(head.querySelectorAll<HTMLLinkElement>('link[data-tab-favicon="true"]'));
  desiredSpecs.forEach((spec, idx) => {
    const link = managed[idx] ?? document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.setAttribute('sizes', spec.sizes);
    link.href = spec.href;
    link.dataset.tabFavicon = 'true';
    link.dataset.faviconColor = color;
    if (!link.parentElement) head.appendChild(link);
  });

  document.documentElement.dataset.faviconColor = color;
}

/**
 * Coordinates open same-origin browser tabs so each active tab claims a distinct
 * favicon color from the 5 Jugnu variants (defaulting to yellow on tab 1).
 */
export function initTabFavicon(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  activeCleanup?.();

  const instanceId = makeInstanceId();
  const createdAt = Date.now();
  const channel =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

  let currentColor: FaviconColor = readSessionColor() ?? FAVICON_COLORS[0];
  let released = false;

  const post = (message: ChannelMessage) => {
    try {
      channel?.postMessage(message);
    } catch {
      // Channel might already be closed during unload.
    }
  };

  const commitLease = (color: FaviconColor, announce: boolean) => {
    const now = Date.now();
    const registry = readRegistry(now);
    registry[instanceId] = { color, createdAt, updatedAt: now };
    writeRegistry(registry);

    if (color !== currentColor || document.documentElement.dataset.faviconColor !== color) {
      currentColor = color;
      writeSessionColor(color);
      applyFaviconLinks(color);
    } else {
      writeSessionColor(color);
    }

    if (announce) {
      post({ type: 'claim', instanceId, color, createdAt });
    }
  };

  const claimInitialOrResolve = () => {
    released = false;
    const now = Date.now();
    const registry = readRegistry(now);
    const chosen = pickBestColor(registry, instanceId, readSessionColor());
    commitLease(chosen, true);
  };

  const resolveConflictWithPeer = (peerId: string, peerColor: FaviconColor, peerCreatedAt: number) => {
    if (released || peerId === instanceId || peerColor !== currentColor) return;

    const now = Date.now();
    const registry = readRegistry(now);
    registry[peerId] = {
      color: peerColor,
      createdAt: peerCreatedAt,
      updatedAt: now,
    };

    // Older tab keeps the contested color; tie-break deterministically by instanceId.
    const selfWins =
      createdAt < peerCreatedAt || (createdAt === peerCreatedAt && instanceId < peerId);

    if (selfWins) {
      registry[instanceId] = { color: currentColor, createdAt, updatedAt: now };
      writeRegistry(registry);
      return;
    }

    const alternate = pickBestColor(registry, instanceId, null);
    registry[instanceId] = { color: alternate, createdAt, updatedAt: now };
    writeRegistry(registry);
    if (alternate !== currentColor) {
      currentColor = alternate;
      writeSessionColor(alternate);
      applyFaviconLinks(alternate);
      post({ type: 'claim', instanceId, color: alternate, createdAt });
    }
  };

  const releaseLease = () => {
    if (released) return;
    released = true;
    const registry = readRegistry(Date.now());
    if (registry[instanceId]) {
      delete registry[instanceId];
      writeRegistry(registry);
    }
    post({ type: 'release', instanceId });
  };

  const onMessage = (event: MessageEvent<ChannelMessage>) => {
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === 'ping') {
      if (!released) {
        commitLease(currentColor, false);
        post({ type: 'claim', instanceId, color: currentColor, createdAt });
      }
      return;
    }
    if (data.type === 'claim') {
      resolveConflictWithPeer(data.instanceId, data.color, data.createdAt);
      return;
    }
    if (data.type === 'release') {
      const registry = readRegistry(Date.now());
      if (registry[data.instanceId]) {
        delete registry[data.instanceId];
        writeRegistry(registry);
      }
    }
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || released) return;
    const registry = readRegistry(Date.now());
    for (const [peerId, lease] of Object.entries(registry)) {
      if (peerId !== instanceId && lease.color === currentColor) {
        resolveConflictWithPeer(peerId, lease.color, lease.createdAt);
        break;
      }
    }
  };

  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted || released) {
      claimInitialOrResolve();
    }
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible' && !released) {
      commitLease(currentColor, false);
    }
  };

  channel?.addEventListener('message', onMessage);
  window.addEventListener('storage', onStorage);
  window.addEventListener('pagehide', releaseLease);
  window.addEventListener('beforeunload', releaseLease);
  window.addEventListener('pageshow', onPageShow);
  document.addEventListener('visibilitychange', onVisibilityChange);

  const heartbeatId = window.setInterval(() => {
    if (!released) commitLease(currentColor, false);
  }, HEARTBEAT_MS);

  claimInitialOrResolve();
  post({ type: 'ping' });

  const cleanup = () => {
    window.clearInterval(heartbeatId);
    channel?.removeEventListener('message', onMessage);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('pagehide', releaseLease);
    window.removeEventListener('beforeunload', releaseLease);
    window.removeEventListener('pageshow', onPageShow);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    releaseLease();
    channel?.close();
    if (activeCleanup === cleanup) activeCleanup = null;
  };

  activeCleanup = cleanup;
  return cleanup;
}
