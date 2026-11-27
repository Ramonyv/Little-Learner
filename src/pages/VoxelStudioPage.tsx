import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import confetti from 'canvas-confetti';
import { CANDY_PALETTE, VOXEL_PALETTE_PACKS, type PalettePack } from '../voxel/palette';
import { VOXEL_TEMPLATES } from '../voxel/templates';
import { GRID_MAX_Y, VoxelStore, isInBounds } from '../voxel/voxelStore';
import type {
  BlockStyle,
  CameraView,
  SavedVoxelWork,
  SymmetryMode,
  VoxelTool,
  VoxelTuple,
} from '../voxel/types';
import type { VoxelCanvasHandle } from '../voxel/VoxelCanvas';
import type { VoxelInteractionPayload } from '../voxel/VoxelScene';
import { readWork, saveWork } from '../utils/localWork';
import { getEnabledAudioContext, playCelebrationFanfare } from '../utils/soundEffects';
import { useSession } from '../context/SessionContext';
import { StudioModeTabs, StudioSwitcher } from '../components/layout/StudioModeTabs';
import { getAgeModeIconSrc, STUDIO_SYSTEM_ICONS, useStudioLayoutVariant } from '../utils/studioLayoutAb';

const DAILY_CHALLENGES = [
  'Build something with wheels!',
  'Build a cozy treehouse!',
  'Build a space rocket!',
  'Build a friendly animal!',
  'Build a rainbow castle!',
  'Build a cute robot friend!',
  'Build an island with a boat!',
];

function getDailyChallenge(): string {
  const now = new Date();
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return DAILY_CHALLENGES[dayOfYear % DAILY_CHALLENGES.length];
}

function playVoxelTone(kind: 'place' | 'erase') {
  const ctx = getEnabledAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = kind === 'place' ? 'sine' : 'triangle';
    if (kind === 'place') {
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(560, now + 0.08);
    } else {
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.09);
    }
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.11);
  } catch {
    /* ignore Web Audio errors */
  }
}

type VoxelAgeMode = 'little' | 'builder' | 'pro';

const AGE_MODE_META: Record<VoxelAgeMode, { label: string; emoji: string; title: string; subtitle: string }> = {
  little: {
    label: 'Little',
    emoji: '🐣',
    title: "I'm Little",
    subtitle: 'Add, Paint & Erase — super simple!',
  },
  builder: {
    label: 'Builder',
    emoji: '🧱',
    title: "I'm a Builder",
    subtitle: 'Adds Fill & Magic Mirror!',
  },
  pro: {
    label: 'Pro',
    emoji: '🚀',
    title: "I'm a Pro",
    subtitle: 'Unlocks Layers, Grid & Import/Export',
  },
};

function speakToolCue(text: string, soundOn: boolean) {
  if (!soundOn || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.96;
    utter.pitch = 1.08;
    utter.volume = 0.75;
    window.speechSynthesis.speak(utter);
  } catch {
    /* ignore speech synthesis errors */
  }
}

const LazyVoxelCanvas = React.lazy(() =>
  import('../voxel/VoxelCanvas').then((m) => ({ default: m.VoxelCanvas })),
);

const VOXEL_STORAGE_KEY = 'll-voxels';
const DEFAULT_WORK_ID = 'voxel-studio-main';

function HoldToDeletePill({
  disabled,
  onConfirm,
}: {
  disabled: boolean;
  onConfirm: () => void;
}) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const triggeredRef = useRef(false);
  const HOLD_MS = 850;

  const stopHold = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setHolding(false);
    setProgress(0);
  }, []);

  const startHold = () => {
    if (disabled) return;
    triggeredRef.current = false;
    setHolding(true);
    startRef.current = performance.now();

    const step = (now: number) => {
      const pct = Math.min(1, (now - startRef.current) / HOLD_MS);
      setProgress(pct);
      if (pct >= 1) {
        if (!triggeredRef.current) {
          triggeredRef.current = true;
          onConfirm();
        }
        stopHold();
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => () => stopHold(), [stopHold]);

  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progress);
  const label = holding ? 'Keep holding...' : 'Hold to Clear';

  const content = (inverted: boolean) => (
    <div className="relative z-10 flex items-center justify-center gap-2.5 w-full h-full px-4">
      <span className="relative w-7 h-7 flex items-center justify-center shrink-0">
        <svg className="absolute inset-0 w-7 h-7 -rotate-90" viewBox="0 0 28 28" aria-hidden="true">
          <circle
            cx="14"
            cy="14"
            r={radius}
            fill="none"
            stroke={inverted ? 'rgba(255,255,255,0.22)' : 'rgba(225,29,72,0.16)'}
            strokeWidth="2.5"
          />
          {holding && (
            <circle
              cx="14"
              cy="14"
              r={radius}
              fill="none"
              stroke={inverted ? '#ffffff' : '#e11d48'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
            />
          )}
        </svg>
        <Icon
          icon="solar:trash-bin-minimalistic-bold"
          className={`w-3.5 h-3.5 ${inverted ? 'text-white' : 'text-rose-600'}`}
        />
      </span>
      <span className={`text-xs font-extrabold whitespace-nowrap ${inverted ? 'text-white' : 'text-[#172951]'}`}>
        {label}
      </span>
    </div>
  );

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={startHold}
      onPointerUp={stopHold}
      onPointerLeave={stopHold}
      onPointerCancel={stopHold}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
          e.preventDefault();
          startHold();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === 'Enter' || e.key === ' ') stopHold();
      }}
      aria-label="Hold to clear canvas"
      className="relative w-full h-10 rounded-full bg-white border border-slate-200 hover:border-rose-300 overflow-hidden select-none touch-none disabled:opacity-45 disabled:cursor-not-allowed shadow-2xs transition-colors"
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-rose-600/20 rounded-r-full pointer-events-none"
        style={{ width: `${progress * 100}%` }}
      />
      {content(false)}
    </button>
  );
}

function AccordionSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bg-white rounded-2xl border border-[#dbe7f6] shadow-xs overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left hover:bg-[#f7faff] transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-black text-[#172951]">
          <Icon icon={icon} className="w-4 h-4 text-[#1676ed]" />
          <span>{title}</span>
        </span>
        <Icon
          icon={open ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'}
          className="w-3.5 h-3.5 text-[#516587]"
        />
      </button>
      {open && <div className="px-3 pb-3 pt-1 border-t border-slate-100">{children}</div>}
    </section>
  );
}

export const VoxelStudioPage: React.FC = () => {
  const { soundOn, recordPuzzleWin } = useSession();
  const { variant: layoutVariant } = useStudioLayoutVariant();
  const isUnified = layoutVariant === 'unified';
  const storeRef = useRef<VoxelStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = new VoxelStore(VOXEL_TEMPLATES[0].voxels);
  }

  const canvasRef = useRef<VoxelCanvasHandle>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const colorDockRef = useRef<HTMLDivElement>(null);

  const [isClient, setIsClient] = useState(false);
  const [voxels, setVoxels] = useState<VoxelTuple[]>(() => storeRef.current!.entries());
  const [, setVersion] = useState(0);

  const [tool, setTool] = useState<VoxelTool>('add');
  const [previousTool, setPreviousTool] = useState<VoxelTool>('add');
  const [activeColor, setActiveColor] = useState<string>(CANDY_PALETTE[0].hex);
  const [palettePackId, setPalettePackId] = useState<PalettePack['id']>('candy');
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [dockPopover, setDockPopover] = useState<'style' | 'recent' | null>(null);
  const [symmetry, setSymmetry] = useState<SymmetryMode>('none');
  const [blockStyle, setBlockStyle] = useState<BlockStyle>('rounded');
  const [cameraView, setCameraView] = useState<CameraView>('iso');
  const [gridSize, setGridSize] = useState<8 | 12 | 16>(16);
  const [maxLayer, setMaxLayer] = useState<number>(GRID_MAX_Y);
  const [gridVisible, setGridVisible] = useState(true);
  const [focusMode, setFocusMode] = useState(false);

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [ageMode, setAgeMode] = useState<VoxelAgeMode>('builder');
  const [showModePicker, setShowModePicker] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<'tools' | 'ideas' | 'more' | null>(null);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [parentGateAction, setParentGateAction] = useState<'import' | 'export' | null>(null);
  const [parentAnswer, setParentAnswer] = useState('');
  const [parentGateError, setParentGateError] = useState(false);
  const awardedMilestonesRef = useRef<Set<number>>(new Set());

  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [selectedInfo, setSelectedInfo] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [poofToastOpen, setPoofToastOpen] = useState(false);
  const poofTimerRef = useRef<number | null>(null);
  const celebratedGuideRef = useRef<string | null>(null);

  // Hydrate saved voxels & generate 3D template thumbnails lazily on client mount
  useEffect(() => {
    setIsClient(true);
    const saved = readWork<[string, SavedVoxelWork][]>(VOXEL_STORAGE_KEY, []);
    const existing = saved.find(([id]) => id === DEFAULT_WORK_ID)?.[1];
    if (existing && Array.isArray(existing.voxels) && existing.voxels.length > 0) {
      storeRef.current!.load(existing.voxels);
      setVoxels(storeRef.current!.entries());
    }
    void import('../voxel/renderThumbnails').then(({ renderTemplateThumbnails }) => {
      setThumbnails(renderTemplateThumbnails(VOXEL_TEMPLATES));
    });
  }, []);

  const syncFromStore = useCallback((persist = true) => {
    const entries = storeRef.current!.entries();
    setVoxels(entries);
    setVersion((v) => v + 1);
    if (persist) {
      const saved = readWork<[string, SavedVoxelWork][]>(VOXEL_STORAGE_KEY, []);
      const filtered = saved.filter(([id]) => id !== DEFAULT_WORK_ID);
      filtered.unshift([
        DEFAULT_WORK_ID,
        { id: DEFAULT_WORK_ID, title: 'My 3D Creation', updatedAt: Date.now(), voxels: entries },
      ]);
      saveWork(VOXEL_STORAGE_KEY, filtered.slice(0, 12));
    }
  }, []);

  const activeTemplate = useMemo(
    () => VOXEL_TEMPLATES.find((t) => t.id === activeGuideId) ?? null,
    [activeGuideId],
  );

  const guideProgress = useMemo(() => {
    if (!activeTemplate) return { remaining: [] as VoxelTuple[], matched: 0, total: 0, percent: 0 };
    const store = storeRef.current!;
    const remaining: VoxelTuple[] = [];
    let matched = 0;
    for (const [x, y, z, color] of activeTemplate.voxels) {
      if (store.has(x, y, z)) matched++;
      else remaining.push([x, y, z, color]);
    }
    const total = activeTemplate.voxels.length;
    const percent = total > 0 ? Math.round((matched / total) * 100) : 0;
    return { remaining, matched, total, percent };
  }, [activeTemplate, voxels]);

  useEffect(() => {
    if (
      activeTemplate &&
      guideProgress.total > 0 &&
      guideProgress.matched === guideProgress.total &&
      celebratedGuideRef.current !== activeTemplate.id
    ) {
      celebratedGuideRef.current = activeTemplate.id;
      void playCelebrationFanfare();
      void confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 } });
      setStatusMessage(`Awesome! You finished building the ${activeTemplate.name}!`);
    }
  }, [activeTemplate, guideProgress]);

  const handleSelectTool = (next: VoxelTool) => {
    if (next !== 'eyedropper') setPreviousTool(next);
    setTool(next);
    if (next !== 'select') setSelectedInfo(null);
    const spoken: Record<VoxelTool, string> = {
      add: 'Add block',
      paint: 'Paint',
      erase: 'Erase',
      fill: 'Fill',
      select: 'Select',
      eyedropper: 'Color picker',
    };
    speakToolCue(spoken[next], soundOn);
  };

  const recordRecentColor = useCallback((hex: string) => {
    const normalized = hex.toLowerCase();
    setRecentColors((prev) => {
      const next = [normalized, ...prev.filter((c) => c.toLowerCase() !== normalized)].slice(0, 6);
      try {
        localStorage.setItem('little-learner.voxel-recent-colors', JSON.stringify(next));
      } catch {
        /* ignore storage quota errors */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('little-learner.voxel-age-mode');
      if (savedMode === 'little' || savedMode === 'builder' || savedMode === 'pro') {
        setAgeMode(savedMode);
      } else {
        setShowModePicker(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const selectAgeMode = (mode: VoxelAgeMode) => {
    setAgeMode(mode);
    setShowModePicker(false);
    try {
      localStorage.setItem('little-learner.voxel-age-mode', mode);
    } catch {
      /* ignore */
    }
    if (mode === 'little' && (tool === 'fill' || tool === 'select')) {
      setTool('add');
    } else if (mode === 'builder' && tool === 'select') {
      setTool('add');
    }
    if (mode === 'little') setSymmetry('none');
    speakToolCue(AGE_MODE_META[mode].title, soundOn);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('little-learner.voxel-recent-colors');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentColors(parsed.filter((item): item is string => typeof item === 'string').slice(0, 6));
        }
      }
    } catch {
      /* ignore invalid storage */
    }
  }, []);

  const handleBlockAction = useCallback(
    ({ x, y, z, action }: VoxelInteractionPayload) => {
      const store = storeRef.current!;

      if (action === 'erase') {
        if (store.erase(x, y, z, symmetry)) {
          playVoxelTone('erase');
          syncFromStore(true);
          setStatusMessage('Erased block');
        }
        return;
      }

      if (tool === 'eyedropper') {
        const picked = store.get(x, y, z);
        if (picked) {
          setActiveColor(picked);
          recordRecentColor(picked);
          setTool(previousTool === 'eyedropper' ? 'add' : previousTool);
          setStatusMessage(`Picked color ${picked}`);
        }
        return;
      }

      if (tool === 'select') {
        const picked = store.get(x, y, z);
        if (picked) {
          setSelectedInfo(`Block at (${x}, ${y + 1}, ${z}) · ${picked}`);
          setActiveColor(picked);
        } else {
          setSelectedInfo(null);
        }
        return;
      }

      let changed = false;
      let usedColor: string | null = null;
      if (tool === 'add') {
        let colorToUse = activeColor;
        if (activeTemplate) {
          const guideMatch = activeTemplate.voxels.find(([gx, gy, gz]) => gx === x && gy === y && gz === z);
          if (guideMatch) colorToUse = guideMatch[3];
        }
        changed = store.add(x, y, z, colorToUse, symmetry);
        if (changed) usedColor = colorToUse;
      } else if (tool === 'paint') {
        changed = store.paint(x, y, z, activeColor, symmetry);
        if (changed) usedColor = activeColor;
      } else if (tool === 'erase') {
        changed = store.erase(x, y, z, symmetry);
      } else if (tool === 'fill') {
        changed = store.fill(x, y, z, activeColor);
        if (changed) usedColor = activeColor;
      }

      if (changed) {
        if (usedColor) recordRecentColor(usedColor);
        playVoxelTone(tool === 'erase' ? 'erase' : 'place');
        syncFromStore(true);
        const count = store.size;
        if (count >= 25 && count % 25 === 0 && !awardedMilestonesRef.current.has(count)) {
          awardedMilestonesRef.current.add(count);
          recordPuzzleWin();
          void playCelebrationFanfare();
          void confetti({ particleCount: 55, spread: 65, origin: { y: 0.7 } });
          setStatusMessage(`⭐ ${count} blocks! +1 Trophy!`);
        }
      }
    },
    [tool, previousTool, activeColor, symmetry, activeTemplate, syncFromStore, recordRecentColor, recordPuzzleWin],
  );

  const handleUndo = () => {
    if (storeRef.current!.undo()) {
      playVoxelTone('erase');
      syncFromStore(true);
    }
  };

  const handleRedo = () => {
    if (storeRef.current!.redo()) {
      playVoxelTone('place');
      syncFromStore(true);
    }
  };

  const handleClear = () => {
    if (storeRef.current!.size === 0) return;
    if (storeRef.current!.clear()) {
      celebratedGuideRef.current = null;
      syncFromStore(true);
      setStatusMessage('Poof! Canvas cleared');
      setPoofToastOpen(true);
      if (poofTimerRef.current !== null) window.clearTimeout(poofTimerRef.current);
      poofTimerRef.current = window.setTimeout(() => {
        setPoofToastOpen(false);
        poofTimerRef.current = null;
      }, 5000);
    }
  };

  const handleUndoPoof = () => {
    if (poofTimerRef.current !== null) {
      window.clearTimeout(poofTimerRef.current);
      poofTimerRef.current = null;
    }
    setPoofToastOpen(false);
    handleUndo();
  };

  useEffect(() => {
    return () => {
      if (poofTimerRef.current !== null) window.clearTimeout(poofTimerRef.current);
    };
  }, []);

  const handleStartGuide = (templateId: string) => {
    const tpl = VOXEL_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    celebratedGuideRef.current = null;
    storeRef.current!.clear();
    setActiveGuideId(tpl.id);
    handleSelectTool('add');
    syncFromStore(true);
    canvasRef.current?.frameModel(tpl.voxels);
    setStatusMessage(`Guided Mode: Tap glowing blocks to build ${tpl.name}!`);
  };

  const handleLoadFullTemplate = (templateId: string) => {
    const tpl = VOXEL_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setActiveGuideId(null);
    storeRef.current!.load(tpl.voxels, true);
    syncFromStore(true);
    canvasRef.current?.frameModel(tpl.voxels);
    setStatusMessage(`Loaded ${tpl.name}!`);
  };

  const handleExportPng = () => {
    const dataUrl = canvasRef.current?.capturePng();
    if (!dataUrl) return;
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 220);
    canvasRef.current?.triggerCelebrationSpin();
    playVoxelTone('place');

    const img = new Image();
    img.onload = () => {
      const pad = 28;
      const footerH = 54;
      const framed = document.createElement('canvas');
      framed.width = img.width + pad * 2;
      framed.height = img.height + pad * 2 + footerH;
      const ctx = framed.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, framed.width, framed.height);
        ctx.drawImage(img, pad, pad);
        ctx.strokeStyle = '#dbe7f6';
        ctx.lineWidth = 4;
        ctx.strokeRect(pad - 2, pad - 2, img.width + 4, img.height + 4);
        ctx.fillStyle = '#172951';
        ctx.font = '900 22px Nunito, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Made in Jugnu 3D Blocks  •  jugnu.fun', framed.width / 2, img.height + pad + 36);
      }
      const link = document.createElement('a');
      link.href = ctx ? framed.toDataURL('image/png') : dataUrl;
      link.download = 'jugnu-blocks-photo.png';
      link.click();
      setStatusMessage('📸 Photo saved!');
    };
    img.src = dataUrl;
  };

  const handleExportVoxelJson = () => {
    const payload = JSON.stringify({ version: 1, voxels: storeRef.current!.entries() });
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jugnu-voxel-model.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setStatusMessage('Voxel file exported!');
  };

  const handleImportVoxelJson = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const list = Array.isArray(parsed) ? parsed : parsed?.voxels;
      if (!Array.isArray(list)) throw new Error('Invalid');
      const valid: VoxelTuple[] = list.filter(
        (item: unknown): item is VoxelTuple =>
          Array.isArray(item) &&
          item.length === 4 &&
          isInBounds(item[0], item[1], item[2]) &&
          typeof item[3] === 'string' &&
          /^#[0-9a-f]{3,8}$/i.test(item[3]),
      );
      if (valid.length === 0) throw new Error('Empty');
      setActiveGuideId(null);
      storeRef.current!.load(valid, true);
      syncFromStore(true);
      canvasRef.current?.frameModel(valid);
      setStatusMessage(`Imported ${valid.length} blocks!`);
    } catch {
      setStatusMessage('Could not import file. Choose a valid Jugnu voxel JSON.');
    }
  };

  const cycleSymmetry = () => {
    const order: SymmetryMode[] = ['none', 'x', 'both'];
    const next = order[(order.indexOf(symmetry) + 1) % order.length];
    setSymmetry(next);
    const msg =
      next === 'none' ? 'Magic Mirror off' : next === 'x' ? '2-Way Magic Mirror' : '4-Way Magic Mirror';
    setStatusMessage(msg);
    speakToolCue(msg, soundOn);
  };

  const cycleLookAround = () => {
    const order: CameraView[] = ['iso', 'front', 'side', 'top'];
    const next = order[(order.indexOf(cameraView) + 1) % order.length];
    handleCameraView(next);
    speakToolCue('Look around', soundOn);
  };

  const handleCameraView = (view: CameraView) => {
    setCameraView(view);
    canvasRef.current?.setCameraView(view);
  };

  const activePack = VOXEL_PALETTE_PACKS.find((p) => p.id === palettePackId) ?? VOXEL_PALETTE_PACKS[0];
  const activeColorName = useMemo(() => {
    const lower = activeColor.toLowerCase();
    for (const pack of VOXEL_PALETTE_PACKS) {
      const match = pack.colors.find((c) => c.hex.toLowerCase() === lower);
      if (match) return match.name;
    }
    return 'Custom Color';
  }, [activeColor]);

  useEffect(() => {
    if (!dockPopover) return;
    const onPointerDown = (e: PointerEvent) => {
      if (colorDockRef.current && !colorDockRef.current.contains(e.target as Node)) {
        setDockPopover(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDockPopover(null);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [dockPopover]);

  const store = storeRef.current!;

  return (
    <section
      className={`voxel-studio ${focusMode ? 'focus-mode fixed inset-0 z-50' : 'flex-1'} bg-gradient-to-b from-[#e4f1fe] via-[#ebf5fe] to-[#dff0ff] px-3 sm:px-5 py-3 sm:py-4 flex flex-col gap-3`}
    >
      {/* Studio Header Bar */}
      <header className={`relative z-40 max-w-[1440px] w-full mx-auto bg-white/90 backdrop-blur-[4px] rounded-[16px] border ${isUnified ? 'border-[#dde7f5] px-4 py-2.5' : 'border-[#dbe7f6] px-3 sm:px-4 py-2.5'} shadow-xs flex flex-wrap items-center justify-between gap-3`}>
        {isUnified ? (
          <StudioSwitcher
            active="voxel-studio"
            subtitle={`Build in 3D with blocks · ${voxels.length} ${voxels.length === 1 ? 'block' : 'blocks'}!`}
          />
        ) : (
          <>
            {/* Title + Colorful Icon + Subtitle */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#4361ee] to-[#7c3aed] flex items-center justify-center text-white shadow-sm shrink-0">
                <Icon icon="solar:box-bold" className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-[#172951] leading-tight">
                  Voxel Studio
                </h1>
                <p className="text-[11px] sm:text-xs font-bold text-[#516587]">
                  Build in 3D with blocks · {voxels.length} {voxels.length === 1 ? 'block' : 'blocks'}!
                </p>
              </div>
            </div>

            {/* Classic Studio Navigation Tabs */}
            <StudioModeTabs active="voxel-studio" compact={false} />
          </>
        )}

        {/* Studio Actions: Age Mode, Undo, Redo, Fullscreen, Save PNG */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowModePicker(true)}
            title="Switch builder level"
            className={
              isUnified
                ? 'h-10 px-3 rounded-full bg-[#f5f8fe] hover:bg-[#eaf1fd] border-2 border-[#dde7f5] text-xs font-black text-[#1b294e] flex items-center gap-1.5 transition-colors'
                : 'px-2.5 py-2 rounded-xl bg-[#f4f8ff] hover:bg-[#e8f2ff] border border-[#dbe7f6] text-xs font-black text-[#172951] flex items-center gap-1.5 transition-colors'
            }
          >
            {isUnified ? (
              <img src={getAgeModeIconSrc(ageMode)} alt="" className="w-4 h-4 object-contain shrink-0" />
            ) : (
              <span>{AGE_MODE_META[ageMode].emoji}</span>
            )}
            <span className="hidden sm:inline">{AGE_MODE_META[ageMode].label}</span>
          </button>

          {isUnified ? (
            <div className="h-10 bg-white border-2 border-[#dee3ed] rounded-full px-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!store.canUndo}
                title="Undo"
                aria-label="Undo"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[#e5ecf8] hover:bg-[#d8e3f5] disabled:bg-transparent disabled:opacity-35 transition-colors"
              >
                <img src={STUDIO_SYSTEM_ICONS.undo} alt="" className="w-5 h-5 object-contain" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!store.canRedo}
                title="Redo"
                aria-label="Redo"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[#e5ecf8] hover:bg-[#d8e3f5] disabled:bg-transparent disabled:opacity-35 transition-colors"
              >
                <img src={STUDIO_SYSTEM_ICONS.redo} alt="" className="w-5 h-5 object-contain" />
              </button>
            </div>
          ) : (
            <div className="flex items-center bg-[#f4f8ff] rounded-xl border border-[#dbe7f6] p-0.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!store.canUndo}
                title="Undo"
                aria-label="Undo"
                className="p-2 rounded-lg text-[#172951] hover:bg-white disabled:opacity-35 transition-colors"
              >
                <Icon icon="solar:undo-left-bold" className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!store.canRedo}
                title="Redo"
                aria-label="Redo"
                className="p-2 rounded-lg text-[#172951] hover:bg-white disabled:opacity-35 transition-colors"
              >
                <Icon icon="solar:undo-right-bold" className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setFocusMode((v) => !v)}
            title={focusMode ? 'Exit Fullscreen' : 'Fullscreen Workspace'}
            aria-label={focusMode ? 'Exit Fullscreen' : 'Fullscreen Workspace'}
            className={`${isUnified ? 'w-10 h-10 rounded-full border-2' : 'p-2.5 rounded-xl border'} flex items-center justify-center transition-colors ${
              focusMode
                ? 'bg-[#1676ed] text-white border-[#1676ed]'
                : isUnified
                  ? 'bg-white hover:bg-[#f5f8fe] text-[#1b294e] border-[#dde7f5]'
                  : 'bg-white hover:bg-[#f4f8ff] text-[#172951] border-[#dbe7f6]'
            }`}
          >
            {isUnified && !focusMode ? (
              <img src={STUDIO_SYSTEM_ICONS.fullscreen} alt="" className="w-5 h-5 object-contain" />
            ) : (
              <Icon
                icon={focusMode ? 'solar:quit-full-screen-bold' : 'solar:full-screen-bold'}
                className="w-4 h-4"
              />
            )}
          </button>

          <button
            type="button"
            onClick={handleExportPng}
            className={
              isUnified
                ? 'h-10 px-4 rounded-full border-[1.5px] border-[#ebb23d] bg-gradient-to-b from-[#fae25b] via-[#f7ce46] to-[#ffd67b] shadow-[0_6px_8px_rgba(235,182,62,0.35),inset_0_2px_2px_rgba(255,255,255,0.85),inset_0_-3px_3px_rgba(170,113,38,0.3)] text-xs font-black text-[#111729] flex items-center gap-1.5 cursor-pointer hover:brightness-105'
                : 'btn-glossy-yellow px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black text-slate-900 flex items-center gap-1.5 cursor-pointer'
            }
          >
            {isUnified ? (
              <img src={STUDIO_SYSTEM_ICONS.takePhoto} alt="" className="w-5 h-5 object-contain" />
            ) : (
              <Icon icon="solar:camera-bold" className="w-4 h-4" />
            )}
            <span>Take a Photo</span>
          </button>
        </div>
      </header>

      {/* Main 3-Column Workspace */}
      <div className="max-w-[1440px] w-full mx-auto flex-1 flex flex-col lg:flex-row gap-3.5 items-stretch min-h-0">
        
        {/* Left Sidebar: Desktop Creation Controls (Age-Gated + "More" Drawer) */}
        {leftOpen ? (
          <aside
            aria-label="Creation controls"
            className="hidden lg:flex w-[236px] shrink-0 flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-170px)] pr-0.5"
          >
            {/* Tools */}
            <AccordionSection title="Tools" icon="solar:box-minimalistic-bold">
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {(
                  [
                    ['add', 'Add', 'solar:box-minimalistic-bold'],
                    ['paint', 'Paint', 'solar:pen-2-bold'],
                    ['erase', 'Erase', 'solar:eraser-bold'],
                    ...(ageMode !== 'little'
                      ? ([['fill', 'Fill', 'solar:paint-roller-bold']] as [VoxelTool, string, string][])
                      : []),
                  ] as [VoxelTool, string, string][]
                ).map(([id, label, icon]) => {
                  const active = tool === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelectTool(id)}
                      className={`flex flex-col items-center justify-center gap-1 min-h-[54px] py-2 px-1 rounded-xl text-[11px] font-extrabold border transition-all ${
                        active
                          ? 'bg-[#1676ed] text-white border-[#1676ed] shadow-xs'
                          : 'bg-[#f8fbff] text-[#172951] border-[#e2ecf8] hover:bg-[#eef5ff]'
                      }`}
                    >
                      <Icon icon={icon} className="w-6 h-6" />
                      <span>{label}</span>
                    </button>
                  );
                })}

                {ageMode !== 'little' && (
                  <button
                    type="button"
                    onClick={cycleSymmetry}
                    className={`flex flex-col items-center justify-center gap-1 min-h-[54px] py-2 px-1 rounded-xl text-[11px] font-extrabold border transition-all ${
                      symmetry !== 'none'
                        ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-xs'
                        : 'bg-[#f8fbff] text-[#172951] border-[#e2ecf8] hover:bg-[#eef5ff]'
                    }`}
                  >
                    <Icon icon="solar:mirror-left-bold" className="w-6 h-6" />
                    <span>{symmetry === 'none' ? 'Magic Mirror' : symmetry === 'x' ? '2-Way' : '4-Way'}</span>
                  </button>
                )}

                {ageMode === 'pro' && (
                  <button
                    type="button"
                    onClick={() => handleSelectTool('select')}
                    className={`flex flex-col items-center justify-center gap-1 min-h-[54px] py-2 px-1 rounded-xl text-[11px] font-extrabold border transition-all ${
                      tool === 'select'
                        ? 'bg-[#f59e0b] text-white border-[#f59e0b] shadow-xs'
                        : 'bg-[#f8fbff] text-[#172951] border-[#e2ecf8] hover:bg-[#eef5ff]'
                    }`}
                  >
                    <Icon icon="solar:cursor-square-bold" className="w-6 h-6" />
                    <span>Select</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={cycleLookAround}
                className="mt-2 w-full min-h-[48px] px-3 py-2 rounded-xl bg-[#f0f6ff] hover:bg-[#e4efff] border border-[#cfe0f5] text-xs font-black text-[#1676ed] flex items-center justify-center gap-2 transition-colors"
              >
                <Icon icon="solar:eye-bold" className="w-5 h-5" />
                <span>Look around</span>
              </button>
            </AccordionSection>

            {/* "More" Drawer for adult / advanced controls */}
            <AccordionSection title="More" icon="solar:tuning-2-bold" defaultOpen={false}>
              <div className="pt-1 space-y-3">
                <div>
                  <div className="text-[11px] font-bold text-[#516587] mb-1.5">Block Style</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        ['classic', 'Classic', 'rounded-[3px]'],
                        ['rounded', 'Rounded', 'rounded-md'],
                        ['soft', 'Soft', 'rounded-xl'],
                      ] as [BlockStyle, string, string][]
                    ).map(([id, label, radiusClass]) => {
                      const active = blockStyle === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setBlockStyle(id)}
                          className={`flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-[11px] font-extrabold border transition-all ${
                            active
                              ? 'bg-[#eef5ff] text-[#1676ed] border-[#1676ed] shadow-xs'
                              : 'bg-[#f8fbff] text-[#172951] border-[#e2ecf8] hover:bg-[#eef5ff]'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 ${radiusClass} ${
                              active ? 'bg-[#1676ed]' : 'bg-[#f59e0b]'
                            } shadow-xs block`}
                          />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold text-[#516587] mb-1.5">Camera Angle</div>
                  <div className="grid grid-cols-4 gap-1">
                    {(
                      [
                        ['iso', 'Iso'],
                        ['front', 'Front'],
                        ['side', 'Side'],
                        ['top', 'Top'],
                      ] as [CameraView, string][]
                    ).map(([v, label]) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => handleCameraView(v)}
                        className={`py-1.5 rounded-lg text-[11px] font-extrabold border transition-colors ${
                          cameraView === v
                            ? 'bg-[#1676ed] text-white border-[#1676ed]'
                            : 'bg-[#f8fbff] text-[#172951] border-[#e2ecf8] hover:bg-[#eef5ff]'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {ageMode === 'pro' && (
                  <>
                    <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-[#516587]">
                      <span>Grid Size</span>
                      <select
                        value={gridSize}
                        onChange={(e) => setGridSize(Number(e.target.value) as 8 | 12 | 16)}
                        className="bg-[#f8fbff] border border-[#dbe7f6] rounded-lg px-2 py-1 text-xs font-extrabold text-[#172951]"
                      >
                        <option value={8}>8 × 8 × 8</option>
                        <option value={12}>12 × 12 × 12</option>
                        <option value={16}>16 × 16 × 16</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#172951]">
                        <span>Layers</span>
                        <span className="text-[#1676ed] font-black">
                          {maxLayer === GRID_MAX_Y ? 'All' : `1–${maxLayer + 1}`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={GRID_MAX_Y}
                        value={maxLayer}
                        onChange={(e) => setMaxLayer(Number(e.target.value))}
                        className="w-full accent-[#1676ed]"
                      />
                    </div>
                  </>
                )}
              </div>
            </AccordionSection>
          </aside>
        ) : (
          <button
            type="button"
            onClick={() => setLeftOpen(true)}
            className="hidden lg:flex self-start px-3 py-2 rounded-2xl bg-white border border-[#dbe7f6] shadow-xs text-xs font-black text-[#172951] items-center gap-1.5"
          >
            <Icon icon="solar:sidebar-minimalistic-bold" className="w-4 h-4 text-[#1676ed]" />
            <span>Tools</span>
          </button>
        )}

        {/* Center 3D Workspace */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 min-h-[440px] lg:min-h-0">
          <div className="relative flex-1 rounded-3xl overflow-hidden border-2 border-white shadow-sm bg-[#dff0ff] min-h-[380px] lg:min-h-0">
            {isClient ? (
              <React.Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center text-[#172951] font-bold">
                    Loading 3D Voxel Studio…
                  </div>
                }
              >
                <LazyVoxelCanvas
                  ref={canvasRef}
                  voxels={voxels}
                  guideVoxels={guideProgress.remaining}
                  tool={tool}
                  activeColor={activeColor}
                  blockStyle={blockStyle}
                  gridSize={gridSize}
                  maxVisibleLayer={maxLayer}
                  gridVisible={gridVisible}
                  onBlockAction={handleBlockAction}
                />
              </React.Suspense>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#172951] font-bold">
                Preparing 3D Voxel Canvas…
              </div>
            )}

            {/* Floating Sidebar Collapse Toggles (Desktop) */}
            <button
              type="button"
              onClick={() => setLeftOpen((v) => !v)}
              title={leftOpen ? 'Collapse Tools' : 'Expand Tools'}
              className="hidden lg:flex absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-[#dbe7f6] shadow-xs items-center justify-center text-[#172951]"
            >
              <Icon
                icon={leftOpen ? 'solar:double-alt-arrow-left-bold' : 'solar:double-alt-arrow-right-bold'}
                className="w-4 h-4"
              />
            </button>

            <button
              type="button"
              onClick={() => setRightOpen((v) => !v)}
              title={rightOpen ? 'Collapse Templates' : 'Expand Templates'}
              className="hidden lg:flex absolute top-3 right-14 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-[#dbe7f6] shadow-xs items-center justify-center text-[#172951]"
            >
              <Icon
                icon={rightOpen ? 'solar:double-alt-arrow-right-bold' : 'solar:double-alt-arrow-left-bold'}
                className="w-4 h-4"
              />
            </button>

            {/* Floating Reset Isometric View */}
            <button
              type="button"
              onClick={() => {
                setCameraView('iso');
                canvasRef.current?.frameModel(voxels);
              }}
              title="Auto-Frame & Reset Isometric Camera"
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-[#dbe7f6] shadow-xs flex items-center justify-center text-[#1676ed]"
            >
              <Icon icon="solar:compass-bold" className="w-5 h-5" />
            </button>

            {/* Floating Poof! 5-second Undo Toast */}
            {poofToastOpen && (
              <div
                role="status"
                className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded-full bg-[#172951] text-white pl-4 pr-2 py-1.5 shadow-lg text-xs font-extrabold whitespace-nowrap"
              >
                <span>✨ Poof! Canvas cleared</span>
                <button
                  type="button"
                  onClick={handleUndoPoof}
                  className="px-3 py-1 rounded-full bg-[#FFC300] text-[#172951] font-black hover:brightness-105 transition-all"
                >
                  Undo
                </button>
              </div>
            )}

            {/* Camera Shutter Flash */}
            {shutterFlash && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-30 bg-white/85 transition-opacity duration-200"
              />
            )}

            {/* Bee Mascot Contextual Hint */}
            {!activeTemplate && !poofToastOpen && (voxels.length === 0 || (voxels.length >= 3 && voxels.length <= 8 && ageMode !== 'little' && symmetry === 'none')) && (
              <div className="pointer-events-none absolute top-3 left-14 z-10 bg-white/95 backdrop-blur-xs rounded-full px-3.5 py-1.5 border border-amber-300 shadow-xs flex items-center gap-2 text-xs font-extrabold text-[#172951]">
                <span aria-hidden="true">🐝</span>
                <span>
                  {voxels.length === 0
                    ? 'Tap anywhere to place a block!'
                    : 'Try Magic Mirror to build twice as fast!'}
                </span>
              </div>
            )}

            {/* Guided Template Progress Pill */}
            {activeTemplate && (
              <div className="absolute top-3 left-14 z-10 bg-white/95 backdrop-blur-sm rounded-2xl px-3.5 py-2 border border-amber-300 shadow-sm flex items-center gap-3">
                <span className="text-base">{activeTemplate.emoji}</span>
                <div>
                  <div className="text-xs font-black text-[#172951]">
                    Building {activeTemplate.name} · {guideProgress.percent}%
                  </div>
                  <div className="w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-brand-green transition-all duration-200"
                      style={{ width: `${guideProgress.percent}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveGuideId(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 ml-1"
                  aria-label="Exit guided mode"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Selected Block Info / Status Toast */}
            {(selectedInfo || statusMessage) && (
              <div
                role="status"
                className="pointer-events-none absolute bottom-14 left-1/2 -translate-x-1/2 z-10 bg-[#172951]/90 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-sm whitespace-nowrap"
              >
                {selectedInfo || statusMessage}
              </div>
            )}

            {/* Bottom-Left Quick Layer Toggle */}
            <button
              type="button"
              onClick={() =>
                setMaxLayer((prev) => (prev === GRID_MAX_Y ? Math.min(4, GRID_MAX_Y) : GRID_MAX_Y))
              }
              title="Toggle Slice View"
              className={`absolute bottom-3 left-3 z-10 w-10 h-10 rounded-full flex items-center justify-center border shadow-xs transition-colors ${
                maxLayer < GRID_MAX_Y
                  ? 'bg-[#1676ed] text-white border-[#1676ed]'
                  : 'bg-white/95 text-[#172951] border-[#dbe7f6] hover:bg-white'
              }`}
            >
              <Icon icon="solar:layers-bold" className="w-5 h-5" />
            </button>

            {/* Bottom-Right Grid Toggle */}
            <button
              type="button"
              onClick={() => setGridVisible((v) => !v)}
              title="Toggle Ground Grid"
              className={`absolute bottom-3 right-3 z-10 w-10 h-10 rounded-full flex items-center justify-center border shadow-xs transition-colors ${
                gridVisible
                  ? 'bg-white/95 text-[#1676ed] border-[#dbe7f6]'
                  : 'bg-white/75 text-slate-400 border-[#dbe7f6]'
              }`}
            >
              <Icon icon="solar:hashtag-bold" className="w-5 h-5" />
            </button>
          </div>

          {/* Floating Bottom Candy Color Palette + Style & Recent Popovers */}
          <div
            ref={colorDockRef}
            className="relative self-center max-w-full bg-white rounded-full border border-[#dbe7f6] shadow-xs px-3 sm:px-4 py-2 flex flex-wrap sm:flex-nowrap items-center justify-center gap-1.5 sm:gap-2"
          >
            {/* Active Color Name Pill (floats cleanly above bar so it never clips at viewport bottom) */}
            {!dockPopover && (
              <div
                aria-live="polite"
                className="pointer-events-none hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-xs border border-[#dbe7f6] shadow-xs text-[11px] font-extrabold text-[#172951] absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-20"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-slate-300/80 shrink-0"
                  style={{ backgroundColor: activeColor }}
                />
                <span>{activeColorName}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setDockPopover(null);
                handleSelectTool('eyedropper');
              }}
              title="Eyedropper (Pick color from any block)"
              aria-label="Eyedropper"
              className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center border transition-all ${
                tool === 'eyedropper'
                  ? 'bg-[#f59e0b] text-white border-[#f59e0b] scale-105'
                  : 'bg-[#f4f8ff] text-[#172951] border-[#dbe7f6] hover:bg-[#e8f2ff]'
              }`}
            >
              <Icon icon="solar:pipette-bold" className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-slate-200 shrink-0" />

            {/* Style / Palette Pack Popover Trigger */}
            <div className="relative shrink-0">
              <button
                type="button"
                aria-expanded={dockPopover === 'style'}
                onClick={() => setDockPopover((p) => (p === 'style' ? null : 'style'))}
                className={`h-9 px-3 rounded-full border text-xs font-extrabold flex items-center gap-1.5 transition-colors ${
                  dockPopover === 'style'
                    ? 'bg-[#1676ed] text-white border-[#1676ed]'
                    : 'bg-[#f4f8ff] text-[#172951] border-[#dbe7f6] hover:bg-[#e8f2ff]'
                }`}
              >
                <Icon icon="solar:pallete-2-bold" className="w-4 h-4" />
                <span>{activePack.label}</span>
                <Icon
                  icon={dockPopover === 'style' ? 'solar:alt-arrow-down-bold' : 'solar:alt-arrow-up-bold'}
                  className="w-3 h-3 opacity-75"
                />
              </button>

              {dockPopover === 'style' && (
                <div className="absolute bottom-full mb-2 left-0 z-30 min-w-[190px] bg-white rounded-2xl border border-[#dbe7f6] shadow-xl p-1.5 space-y-1">
                  <p className="px-2.5 pt-1 pb-0.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Color Style
                  </p>
                  {VOXEL_PALETTE_PACKS.map((pack) => {
                    const active = palettePackId === pack.id;
                    return (
                      <button
                        key={pack.id}
                        type="button"
                        onClick={() => {
                          setPalettePackId(pack.id);
                          setDockPopover(null);
                        }}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs font-extrabold transition-colors ${
                          active
                            ? 'bg-[#eef6ff] text-[#1676ed]'
                            : 'text-[#172951] hover:bg-[#f4f8ff]'
                        }`}
                      >
                        <span>{pack.label}</span>
                        <span className="flex items-center -space-x-1">
                          {pack.colors.slice(0, 4).map((c) => (
                            <span
                              key={c.id}
                              className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-slate-200 shrink-0" />

            {activePack.colors.map((c) => {
              const selected = activeColor.toLowerCase() === c.hex.toLowerCase();
              const isLight = c.hex.toUpperCase() === '#FFFFFF' || c.hex.toUpperCase() === '#FFFBEB' || c.hex.toUpperCase() === '#FFE8C2';
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActiveColor(c.hex);
                    setDockPopover(null);
                  }}
                  aria-label={c.name}
                  title={c.name}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl shrink-0 transition-transform flex items-center justify-center ${
                    isLight ? 'border border-slate-300' : ''
                  } ${selected ? 'scale-110 ring-2 ring-[#172951] ring-offset-2' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c.hex }}
                >
                  {selected && (
                    <Icon
                      icon="solar:check-read-bold"
                      className={`w-4 h-4 drop-shadow-xs ${
                        c.hex === '#1E293B' || c.hex === '#111827' || c.hex === '#0F172A'
                          ? 'text-white'
                          : 'text-slate-900'
                      }`}
                    />
                  )}
                </button>
              );
            })}

            <label
              title="Custom Color"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full shrink-0 cursor-pointer border-2 border-slate-200 overflow-hidden shadow-xs hover:scale-105 transition-transform"
              style={{
                background:
                  'conic-gradient(#ff4d6d, #ffc300, #22c55e, #38bdf8, #4361ee, #c77dff, #ff4d6d)',
              }}
            >
              <input
                type="color"
                value={activeColor}
                onChange={(e) => setActiveColor(e.target.value)}
                className="opacity-0 w-full h-full cursor-pointer"
                aria-label="Pick custom block color"
              />
            </label>

            <div className="w-px h-6 bg-slate-200 shrink-0" />

            {/* Recent Colors Popover Trigger */}
            <div className="relative shrink-0">
              <button
                type="button"
                disabled={recentColors.length === 0}
                aria-expanded={dockPopover === 'recent'}
                onClick={() => setDockPopover((p) => (p === 'recent' ? null : 'recent'))}
                title={recentColors.length === 0 ? 'No recent colors yet' : 'Recent colors'}
                className={`h-9 px-3 rounded-full border text-xs font-extrabold flex items-center gap-1.5 transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                  dockPopover === 'recent'
                    ? 'bg-[#1676ed] text-white border-[#1676ed]'
                    : 'bg-[#f4f8ff] text-[#172951] border-[#dbe7f6] hover:bg-[#e8f2ff]'
                }`}
              >
                <Icon icon="solar:history-bold" className="w-4 h-4" />
                <span>Recent</span>
                {recentColors.length > 0 && (
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white shadow-2xs"
                    style={{ backgroundColor: recentColors[0] }}
                  />
                )}
              </button>

              {dockPopover === 'recent' && recentColors.length > 0 && (
                <div className="absolute bottom-full mb-2 right-0 z-30 bg-white rounded-2xl border border-[#dbe7f6] shadow-xl p-2.5 space-y-2 min-w-[180px]">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Recent Colors
                  </p>
                  <div className="flex items-center gap-2">
                    {recentColors.map((hex) => {
                      const selected = activeColor.toLowerCase() === hex.toLowerCase();
                      return (
                        <button
                          key={`recent-${hex}`}
                          type="button"
                          onClick={() => {
                            setActiveColor(hex);
                            setDockPopover(null);
                          }}
                          aria-label={`Use recent color ${hex}`}
                          title={`Recent color ${hex}`}
                          className={`w-8 h-8 rounded-full shrink-0 border border-slate-300/70 transition-transform flex items-center justify-center ${
                            selected ? 'scale-110 ring-2 ring-[#172951] ring-offset-2' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: hex }}
                        >
                          {selected && (
                            <Icon icon="solar:check-read-bold" className="w-3.5 h-3.5 text-slate-900 drop-shadow-xs" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Floating Toolbar (opens Bottom Sheets) */}
          <div className="lg:hidden flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setMobileSheet('tools')}
              className="flex-1 min-h-[48px] px-3 py-2 rounded-2xl bg-white border border-[#dbe7f6] shadow-xs text-xs font-black text-[#172951] flex items-center justify-center gap-1.5"
            >
              <Icon icon="solar:box-minimalistic-bold" className="w-5 h-5 text-[#1676ed]" />
              <span>Tools</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileSheet('ideas')}
              className="flex-1 min-h-[48px] px-3 py-2 rounded-2xl bg-white border border-[#dbe7f6] shadow-xs text-xs font-black text-[#172951] flex items-center justify-center gap-1.5"
            >
              <Icon icon="solar:gamepad-bold" className="w-5 h-5 text-[#7c3aed]" />
              <span>Ideas</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileSheet('more')}
              className="flex-1 min-h-[48px] px-3 py-2 rounded-2xl bg-white border border-[#dbe7f6] shadow-xs text-xs font-black text-[#172951] flex items-center justify-center gap-1.5"
            >
              <Icon icon="solar:tuning-2-bold" className="w-5 h-5 text-[#f59e0b]" />
              <span>More</span>
            </button>
          </div>
        </div>

        {/* Right Sidebar: Ideas + Quick Actions */}
        {rightOpen ? (
          <aside
            aria-label="Ideas and quick actions"
            className="hidden lg:flex w-[248px] shrink-0 flex-col gap-3 overflow-y-auto max-h-[calc(100vh-170px)]"
          >
            <div className="bg-white rounded-3xl border border-[#dbe7f6] shadow-xs p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs sm:text-sm font-black text-[#172951] flex items-center gap-1.5">
                  <Icon icon="solar:gamepad-bold" className="w-4 h-4 text-[#7c3aed]" />
                  <span>Ideas</span>
                </span>
              </div>

              <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-sky-50 border border-amber-200 px-3 py-2 text-left">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                  ⭐ Daily Challenge
                </div>
                <div className="text-xs font-extrabold text-[#172951] mt-0.5">
                  {getDailyChallenge()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {VOXEL_TEMPLATES.map((tpl) => {
                  const isGuiding = activeGuideId === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      className={`rounded-2xl border-2 p-2 flex flex-col items-center text-center transition-all ${
                        isGuiding
                          ? 'border-[#ffc300] bg-amber-50/70 shadow-xs'
                          : 'border-[#eef3fb] bg-[#f9fbff] hover:border-[#cfe0f5]'
                      }`}
                    >
                      {thumbnails[tpl.id] ? (
                        <img
                          src={thumbnails[tpl.id]}
                          alt={`${tpl.name} 3D preview`}
                          className="w-14 h-14 object-contain mb-1"
                        />
                      ) : (
                        <span className="text-2xl mb-1">{tpl.emoji}</span>
                      )}
                      <span className="text-xs font-black text-[#172951] mb-1.5">{tpl.name}</span>
                      <div className="flex gap-1 w-full">
                        <button
                          type="button"
                          onClick={() => handleStartGuide(tpl.id)}
                          className="flex-1 py-1 rounded-lg bg-white hover:bg-[#eef5ff] border border-[#dbe7f6] text-[10px] font-black text-[#1676ed]"
                        >
                          Guide
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadFullTemplate(tpl.id)}
                          className="flex-1 py-1 rounded-lg bg-[#172951] hover:bg-slate-800 text-[10px] font-black text-white"
                        >
                          Load
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-3xl border border-[#dbe7f6] shadow-xs p-3.5 flex flex-col gap-2">
              <span className="text-xs font-black text-[#172951] flex items-center gap-1.5 px-1 mb-0.5">
                <Icon icon="solar:bolt-bold" className="w-4 h-4 text-[#f59e0b]" />
                <span>Quick Actions</span>
              </span>

              <HoldToDeletePill disabled={voxels.length === 0} onConfirm={handleClear} />

              {ageMode === 'pro' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setParentAnswer('');
                      setParentGateError(false);
                      setParentGateAction('import');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-[#f8fbff] hover:bg-[#eef5ff] border border-[#dbe7f6] text-xs font-extrabold text-[#172951] flex items-center justify-center gap-2 transition-colors"
                  >
                    <Icon icon="solar:upload-minimalistic-bold" className="w-4 h-4 text-[#1676ed]" />
                    <span>Import Blocks</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setParentAnswer('');
                      setParentGateError(false);
                      setParentGateAction('export');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-[#f8fbff] hover:bg-[#eef5ff] border border-[#dbe7f6] text-xs font-extrabold text-[#172951] flex items-center justify-center gap-2 transition-colors"
                  >
                    <Icon icon="solar:file-download-bold" className="w-4 h-4 text-[#7c3aed]" />
                    <span>Export Blocks</span>
                  </button>
                </>
              )}
              <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                onChange={(e) => {
                  void handleImportVoxelJson(e.target.files?.[0]);
                  e.target.value = '';
                }}
                className="hidden"
              />
            </div>
          </aside>
        ) : (
          <button
            type="button"
            onClick={() => setRightOpen(true)}
            className="hidden lg:flex self-start px-3 py-2 rounded-2xl bg-white border border-[#dbe7f6] shadow-xs text-xs font-black text-[#172951] items-center gap-1.5"
          >
            <Icon icon="solar:gamepad-bold" className="w-4 h-4 text-[#7c3aed]" />
            <span>Ideas</span>
          </button>
        )}

      </div>

      {/* Mobile Bottom Sheet Drawer */}
      {mobileSheet && (
        <div className="fixed inset-0 z-40 lg:hidden flex flex-col justify-end">
          <button
            type="button"
            aria-label="Close panel"
            onClick={() => setMobileSheet(null)}
            className="absolute inset-0 bg-slate-900/35 backdrop-blur-[2px]"
          />
          <div className="relative z-10 bg-white rounded-t-3xl border-t border-[#dbe7f6] p-4 pb-6 max-h-[70dvh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-[#172951] capitalize">{mobileSheet}</span>
              <button
                type="button"
                onClick={() => setMobileSheet(null)}
                className="px-3 py-1 rounded-full bg-[#f0f6ff] text-xs font-black text-[#1676ed]"
              >
                Done
              </button>
            </div>

            {mobileSheet === 'tools' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ['add', 'Add', 'solar:box-minimalistic-bold'],
                      ['paint', 'Paint', 'solar:pen-2-bold'],
                      ['erase', 'Erase', 'solar:eraser-bold'],
                      ...(ageMode !== 'little'
                        ? ([['fill', 'Fill', 'solar:paint-roller-bold']] as [VoxelTool, string, string][])
                        : []),
                    ] as [VoxelTool, string, string][]
                  ).map(([id, label, icon]) => {
                    const active = tool === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          handleSelectTool(id);
                          setMobileSheet(null);
                        }}
                        className={`flex flex-col items-center justify-center gap-1.5 min-h-[58px] py-2 px-1 rounded-2xl text-xs font-extrabold border transition-all ${
                          active
                            ? 'bg-[#1676ed] text-white border-[#1676ed]'
                            : 'bg-[#f8fbff] text-[#172951] border-[#e2ecf8]'
                        }`}
                      >
                        <Icon icon={icon} className="w-6 h-6" />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                  {ageMode !== 'little' && (
                    <button
                      type="button"
                      onClick={() => {
                        cycleSymmetry();
                        setMobileSheet(null);
                      }}
                      className={`flex flex-col items-center justify-center gap-1.5 min-h-[58px] py-2 px-1 rounded-2xl text-xs font-extrabold border ${
                        symmetry !== 'none'
                          ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                          : 'bg-[#f8fbff] text-[#172951] border-[#e2ecf8]'
                      }`}
                    >
                      <Icon icon="solar:mirror-left-bold" className="w-6 h-6" />
                      <span>{symmetry === 'none' ? 'Magic Mirror' : symmetry === 'x' ? '2-Way' : '4-Way'}</span>
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={cycleLookAround}
                  className="w-full min-h-[48px] rounded-2xl bg-[#f0f6ff] text-xs font-black text-[#1676ed] flex items-center justify-center gap-2"
                >
                  <Icon icon="solar:eye-bold" className="w-5 h-5" />
                  <span>Look around</span>
                </button>
              </div>
            )}

            {mobileSheet === 'ideas' && (
              <div className="grid grid-cols-2 gap-2.5">
                {VOXEL_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="rounded-2xl border border-[#e2ecf8] bg-[#f9fbff] p-2.5 flex flex-col items-center text-center"
                  >
                    {thumbnails[tpl.id] ? (
                      <img src={thumbnails[tpl.id]} alt={tpl.name} className="w-14 h-14 object-contain mb-1" />
                    ) : (
                      <span className="text-2xl mb-1">{tpl.emoji}</span>
                    )}
                    <span className="text-xs font-black text-[#172951] mb-2">{tpl.name}</span>
                    <div className="flex gap-1.5 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          handleStartGuide(tpl.id);
                          setMobileSheet(null);
                        }}
                        className="flex-1 min-h-[38px] rounded-xl bg-white border border-[#dbe7f6] text-xs font-black text-[#1676ed]"
                      >
                        Guide
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleLoadFullTemplate(tpl.id);
                          setMobileSheet(null);
                        }}
                        className="flex-1 min-h-[38px] rounded-xl bg-[#172951] text-xs font-black text-white"
                      >
                        Load
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {mobileSheet === 'more' && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold text-[#516587] mb-1.5">Block Style</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(['classic', 'rounded', 'soft'] as BlockStyle[]).map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setBlockStyle(style)}
                        className={`min-h-[44px] rounded-xl text-xs font-extrabold capitalize border ${
                          blockStyle === style
                            ? 'bg-[#eef5ff] text-[#1676ed] border-[#1676ed]'
                            : 'bg-[#f8fbff] text-[#172951] border-[#e2ecf8]'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
                <HoldToDeletePill disabled={voxels.length === 0} onConfirm={() => { handleClear(); setMobileSheet(null); }} />
                {ageMode === 'pro' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => importInputRef.current?.click()}
                      className="min-h-[44px] rounded-xl bg-[#f8fbff] border border-[#dbe7f6] text-xs font-extrabold text-[#172951]"
                    >
                      Import Blocks
                    </button>
                    <button
                      type="button"
                      onClick={handleExportVoxelJson}
                      className="min-h-[44px] rounded-xl bg-[#f8fbff] border border-[#dbe7f6] text-xs font-extrabold text-[#172951]"
                    >
                      Export Blocks
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* First-Launch Age / Skill Mode Picker */}
      {showModePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs">
          <div
            role="dialog"
            aria-label="Choose your builder level"
            className="w-full max-w-md rounded-3xl bg-white border-2 border-[#dbe7f6] shadow-2xl p-5 sm:p-6 space-y-4"
          >
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-[#172951]">How do you want to build?</h2>
              <p className="text-xs font-bold text-[#516587]">You can switch levels anytime at the top!</p>
            </div>
            <div className="space-y-2.5">
              {(['little', 'builder', 'pro'] as VoxelAgeMode[]).map((mode) => {
                const info = AGE_MODE_META[mode];
                const active = ageMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => selectAgeMode(mode)}
                    className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border-2 text-left transition-all ${
                      active
                        ? 'border-[#1676ed] bg-[#eef5ff]'
                        : 'border-[#e7eff9] bg-[#f8fbff] hover:border-[#bfdbfe]'
                    }`}
                  >
                    <span className="w-12 h-12 rounded-2xl bg-white border border-[#dbe7f6] flex items-center justify-center shrink-0">
                      <img src={getAgeModeIconSrc(mode)} alt="" className="w-4 h-4 object-contain" />
                    </span>
                    <div>
                      <div className="text-sm font-black text-[#172951]">{info.title}</div>
                      <div className="text-xs font-bold text-[#516587]">{info.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Parent Math Gate for Import/Export */}
      {parentGateAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (parentAnswer.trim() === '12') {
                const action = parentGateAction;
                setParentGateAction(null);
                if (action === 'import') importInputRef.current?.click();
                else handleExportVoxelJson();
              } else {
                setParentGateError(true);
              }
            }}
            className="w-full max-w-xs rounded-3xl bg-white border-2 border-[#dbe7f6] shadow-2xl p-5 space-y-3 text-center"
          >
            <h2 className="text-base font-black text-[#172951]">Parent Check</h2>
            <p className="text-xs font-bold text-[#516587]">What is 7 + 5?</p>
            <input
              type="number"
              inputMode="numeric"
              autoFocus
              value={parentAnswer}
              onChange={(e) => {
                setParentAnswer(e.target.value);
                setParentGateError(false);
              }}
              placeholder="Answer"
              className="w-full px-3 py-2 rounded-xl border border-[#dbe7f6] text-center text-sm font-black text-[#172951]"
            />
            {parentGateError && (
              <p className="text-xs font-bold text-rose-600">Try again!</p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setParentGateAction(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 text-xs font-extrabold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-[#1676ed] text-xs font-black text-white"
              >
                Continue
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};
