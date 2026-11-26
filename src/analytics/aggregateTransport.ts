import type { AnalyticsConfig } from './config';
import type { AnalyticsEventName, ParamPrimitive } from './events';
import type { AnalyticsTransport } from './ga4Transport';

interface QueuedEvent {
  name: AnalyticsEventName;
  params: Record<string, ParamPrimitive>;
}

const MAX_BATCH_SIZE = 5;
const MAX_QUEUE_SIZE = 25;
const FLUSH_DELAY_MS = 1200;

/**
 * First-party aggregate-only event transport targeting Netlify Functions.
 * Sends zero cookies, zero user/session identifiers, and zero PII; drops silently on error.
 */
export class AggregateTransport implements AnalyticsTransport {
  readonly name = 'first_party_aggregate';
  private queue: QueuedEvent[] = [];
  private timerId: number | null = null;
  private listenersBound = false;

  constructor(private readonly config: AnalyticsConfig) {
    this.bindFlushListeners();
  }

  private bindFlushListeners(): void {
    if (this.listenersBound || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    this.listenersBound = true;
    const onHide = () => {
      if (document.visibilityState === 'hidden') this.flush(true);
    };
    const onPageHide = () => this.flush(true);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onPageHide);
  }

  private isAllowed(): boolean {
    return (
      typeof window !== 'undefined' &&
      this.config.enabled &&
      this.config.aggregateEnabled &&
      this.config.aggregateEndpoint.startsWith('/')
    );
  }

  send(eventName: AnalyticsEventName, params: Record<string, ParamPrimitive>): void {
    if (!this.isAllowed()) return;

    if (this.queue.length >= MAX_QUEUE_SIZE) {
      this.queue.shift();
    }
    this.queue.push({ name: eventName, params });

    if (this.queue.length >= MAX_BATCH_SIZE) {
      this.flush(false);
      return;
    }

    if (this.timerId === null && typeof window !== 'undefined') {
      this.timerId = window.setTimeout(() => {
        this.timerId = null;
        this.flush(false);
      }, FLUSH_DELAY_MS);
    }
  }

  flush(useBeacon = false): void {
    if (!this.isAllowed() || this.queue.length === 0) return;

    if (this.timerId !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, MAX_BATCH_SIZE);
      const body = JSON.stringify({ events: batch });

      try {
        if (
          useBeacon &&
          typeof navigator !== 'undefined' &&
          typeof navigator.sendBeacon === 'function'
        ) {
          const blob = new Blob([body], { type: 'application/json' });
          navigator.sendBeacon(this.config.aggregateEndpoint, blob);
          continue;
        }

        if (typeof fetch === 'function') {
          void fetch(this.config.aggregateEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
            credentials: 'omit',
          }).catch(() => {});
        }
      } catch {
        // Network/beacon errors must never affect child-facing experiences.
      }
    }
  }
}

