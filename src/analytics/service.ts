import { AggregateTransport } from './aggregateTransport';
import { loadAnalyticsConfig, type AnalyticsConfig } from './config';
import {
  isValidAnalyticsEventName,
  sanitizeEventParams,
  type AnalyticsEventName,
  type AnalyticsEventPayloadMap,
  type ParamPrimitive,
} from './events';
import { Ga4Transport, type AnalyticsTransport } from './ga4Transport';

export interface RecordedAnalyticsEvent {
  name: AnalyticsEventName;
  params: Record<string, ParamPrimitive>;
  timestamp: number;
  droppedKeys?: string[];
}

export interface TrackOptions {
  dedupeKey?: string;
  dedupeWindowMs?: number;
}

const MAX_MOCK_BUFFER = 200;

export class AnalyticsService {
  private config: AnalyticsConfig;
  private transports: AnalyticsTransport[] = [];
  private recentEvents = new Map<string, number>();
  private mockEvents: RecordedAnalyticsEvent[] = [];
  private currentSection: string | undefined;

  constructor(config: Partial<AnalyticsConfig> = {}, transports?: AnalyticsTransport[]) {
    this.config = loadAnalyticsConfig(config);
    this.transports = transports ?? this.buildDefaultTransports();
  }

  private buildDefaultTransports(): AnalyticsTransport[] {
    return [
      new AggregateTransport(this.config),
      new Ga4Transport(this.config, () => this.currentSection),
    ];
  }

  getConfig(): Readonly<AnalyticsConfig> {
    return this.config;
  }

  configure(partial: Partial<AnalyticsConfig>): void {
    this.config = loadAnalyticsConfig({ ...this.config, ...partial });
    this.transports = this.buildDefaultTransports();
  }

  addTransport(transport: AnalyticsTransport): void {
    this.transports.push(transport);
  }

  clearTransports(): void {
    this.transports = [];
  }

  getMockEvents(): readonly RecordedAnalyticsEvent[] {
    return this.mockEvents.slice();
  }

  clearMockEvents(): void {
    this.mockEvents = [];
    this.recentEvents.clear();
  }

  track<K extends AnalyticsEventName>(
    eventName: K,
    rawParams?: AnalyticsEventPayloadMap[K],
    options: TrackOptions = {},
  ): boolean {
    try {
      if (!isValidAnalyticsEventName(eventName)) {
        return false;
      }

      const { params, droppedKeys } = sanitizeEventParams(
        eventName,
        rawParams as Record<string, unknown> | undefined,
      );

      if (eventName === 'section_viewed' && typeof params.section_id === 'string') {
        this.currentSection = params.section_id;
      }

      if (droppedKeys.length > 0 && this.config.debug) {
        // Log only key names — never log rejected raw values in case they held PII.
        console.debug('[JugnuAnalytics] Stripped disallowed parameters:', eventName, droppedKeys);
      }

      const now = Date.now();
      const dedupeWindow = options.dedupeWindowMs ?? this.config.dedupeWindowMs;
      const dedupeKey = options.dedupeKey ?? `${eventName}:${JSON.stringify(params)}`;

      if (dedupeWindow > 0) {
        const lastSent = this.recentEvents.get(dedupeKey);
        if (lastSent !== undefined && now - lastSent < dedupeWindow) {
          return false;
        }
        this.recentEvents.set(dedupeKey, now);
        if (this.recentEvents.size > 150) {
          const oldestAllowed = now - dedupeWindow;
          for (const [k, ts] of this.recentEvents.entries()) {
            if (ts < oldestAllowed) this.recentEvents.delete(k);
          }
        }
      }

      const record: RecordedAnalyticsEvent = {
        name: eventName,
        params,
        timestamp: now,
        ...(droppedKeys.length > 0 ? { droppedKeys } : {}),
      };

      // In development/test mode keep an in-memory bounded ring buffer (never persisted).
      if (this.config.debug || this.config.enabled) {
        this.mockEvents.push(record);
        if (this.mockEvents.length > MAX_MOCK_BUFFER) {
          this.mockEvents.shift();
        }
      }

      if (this.config.debug && typeof console !== 'undefined') {
        console.debug('[JugnuAnalytics:mock]', eventName, params);
      }

      // Live external transmission stays disabled unless master switch is true.
      if (!this.config.enabled) {
        return true;
      }

      for (const transport of this.transports) {
        try {
          transport.send(eventName, params);
        } catch (err) {
          if (this.config.debug) {
            console.warn(
              '[JugnuAnalytics] Transport failure ignored:',
              transport.name,
              err instanceof Error ? err.message : 'unknown',
            );
          }
        }
      }

      return true;
    } catch {
      // Analytics must never interrupt gameplay, drawing, learning, or navigation.
      return false;
    }
  }
}

export function createAnalyticsService(
  config: Partial<AnalyticsConfig> = {},
  transports?: AnalyticsTransport[],
): AnalyticsService {
  return new AnalyticsService(config, transports);
}

export const analytics = new AnalyticsService();

declare global {
  interface Window {
    __JUGNU_ANALYTICS__?: AnalyticsService;
  }
}

if (typeof window !== 'undefined' && analytics.getConfig().debug) {
  window.__JUGNU_ANALYTICS__ = analytics;
}
