import {
  GA4_CHILD_SAFE_CONFIG,
  GA4_DENIED_CONSENT_DEFAULTS,
  PARENT_MARKETING_SECTIONS,
  type AnalyticsConfig,
} from './config';
import type { AnalyticsEventName, ParamPrimitive } from './events';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export interface AnalyticsTransport {
  readonly name: string;
  send(eventName: AnalyticsEventName, params: Record<string, ParamPrimitive>): void;
}

const GA4_MARKETING_EVENTS: ReadonlySet<AnalyticsEventName> = new Set([
  'section_viewed',
  'subject_selected',
  'activity_selected',
]);

/**
 * Hard privacy boundary: prevents GA4 from ever receiving events originating from
 * child-facing games, drawing boards, practice sessions, worksheets, or private routes.
 */
export function isEventAllowedForGa4(
  eventName: AnalyticsEventName,
  params: Record<string, ParamPrimitive>,
  activeSection?: string,
): boolean {
  if (!GA4_MARKETING_EVENTS.has(eventName)) return false;

  if (eventName === 'section_viewed') {
    return typeof params.section_id === 'string' && PARENT_MARKETING_SECTIONS.has(params.section_id);
  }

  const section =
    typeof params.source_section === 'string' ? params.source_section : activeSection;
  return typeof section === 'string' && PARENT_MARKETING_SECTIONS.has(section);
}

/**
 * Lazy Google Analytics 4 transport.
 * Strictly inert unless enabled, ga4Enabled, AND childPrivacyApproved are all true,
 * AND restricted strictly to parent-facing marketing/informational pages.
 */
export class Ga4Transport implements AnalyticsTransport {
  readonly name = 'ga4';
  private initialized = false;
  private scriptInjected = false;

  constructor(
    private readonly config: AnalyticsConfig,
    private readonly getCurrentSection?: () => string | undefined,
  ) {}

  private isAllowedToLoad(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof document !== 'undefined' &&
      this.config.enabled &&
      this.config.ga4Enabled &&
      this.config.childPrivacyApproved &&
      /^G-[A-Z0-9]+$/i.test(this.config.ga4MeasurementId)
    );
  }

  private ensureLoaded(): boolean {
    if (!this.isAllowedToLoad()) return false;
    if (this.initialized) return true;

    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
      window.gtag = function gtag(...args: unknown[]) {
        window.dataLayer?.push(args);
      };
    }

    window.gtag('consent', 'default', GA4_DENIED_CONSENT_DEFAULTS);
    window.gtag('js', new Date());
    window.gtag('config', this.config.ga4MeasurementId, GA4_CHILD_SAFE_CONFIG);

    if (!this.scriptInjected) {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[data-ga4-id="${this.config.ga4MeasurementId}"]`,
      );
      if (!existing) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(this.config.ga4MeasurementId)}`;
        script.dataset.ga4Id = this.config.ga4MeasurementId;
        document.head?.appendChild(script);
      }
      this.scriptInjected = true;
    }

    this.initialized = true;
    return true;
  }

  send(eventName: AnalyticsEventName, params: Record<string, ParamPrimitive>): void {
    const activeSection = this.getCurrentSection?.();
    if (!isEventAllowedForGa4(eventName, params, activeSection)) return;
    if (!this.ensureLoaded() || typeof window.gtag !== 'function') return;

    window.gtag('event', eventName, {
      ...params,
      non_interaction: eventName === 'section_viewed',
    });
  }
}
