export interface AnalyticsConfig {
  /** Master kill switch. Keeps all production analytics collection disabled by default. */
  enabled: boolean;
  /** First-party aggregate counter switch (disabled by default until approved/deployed). */
  aggregateEnabled: boolean;
  /** Disables Google Analytics 4 unless explicitly enabled and approved. */
  ga4Enabled: boolean;
  /** Explicit child-privacy compliance sign-off gate before loading any third-party script. */
  childPrivacyApproved: boolean;
  /** Target GA4 Measurement ID for future parent-facing marketing activation. */
  ga4MeasurementId: string;
  /** First-party Netlify function endpoint for anonymous aggregate event counts. */
  aggregateEndpoint: string;
  /** Enables local console debug output & in-memory mock ring buffer in development/test. */
  debug: boolean;
  /** Minimum interval (ms) to suppress duplicate identical events. */
  dedupeWindowMs: number;
}

const DEFAULT_GA4_MEASUREMENT_ID = 'G-JZV578ZF17';
const DEFAULT_AGGREGATE_ENDPOINT = '/.netlify/functions/analytics-collect';
const DEFAULT_DEDUPE_WINDOW_MS = 1500;

/**
 * Only non-child, parent/educator-facing marketing & policy pages may ever emit to GA4
 * when explicitly approved and enabled. Child games, drawing, exams, and tools stay
 * exclusively on first-party aggregate counters.
 */
export const PARENT_MARKETING_SECTIONS: ReadonlySet<string> = new Set([
  'home',
  'about',
  'information',
  'contact',
]);

function readViteEnv(): Record<string, unknown> {
  try {
    return typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function readBoolFlag(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  return fallback;
}

export function loadAnalyticsConfig(overrides: Partial<AnalyticsConfig> = {}): AnalyticsConfig {
  const env = readViteEnv();
  const isDev = Boolean(import.meta?.env?.DEV ?? env.DEV);
  const enabledFlag = import.meta?.env?.VITE_ANALYTICS_ENABLED ?? env.VITE_ANALYTICS_ENABLED;
  const aggregateFlag =
    import.meta?.env?.VITE_AGGREGATE_ANALYTICS_ENABLED ?? env.VITE_AGGREGATE_ANALYTICS_ENABLED;
  const ga4Flag = import.meta?.env?.VITE_GA4_ENABLED ?? env.VITE_GA4_ENABLED;
  const approvedFlag =
    import.meta?.env?.VITE_ANALYTICS_CHILD_PRIVACY_APPROVED ??
    env.VITE_ANALYTICS_CHILD_PRIVACY_APPROVED;
  const measurementRaw =
    import.meta?.env?.VITE_GA4_MEASUREMENT_ID ?? env.VITE_GA4_MEASUREMENT_ID;
  const aggregateRaw =
    import.meta?.env?.VITE_AGGREGATE_ANALYTICS_ENDPOINT ??
    env.VITE_AGGREGATE_ANALYTICS_ENDPOINT;
  const debugFlag = import.meta?.env?.VITE_ANALYTICS_DEBUG ?? env.VITE_ANALYTICS_DEBUG;

  const measurementId =
    typeof measurementRaw === 'string' && /^G-[A-Z0-9]+$/i.test(measurementRaw.trim())
      ? measurementRaw.trim()
      : DEFAULT_GA4_MEASUREMENT_ID;

  const endpoint =
    typeof aggregateRaw === 'string' && aggregateRaw.trim().startsWith('/')
      ? aggregateRaw.trim()
      : DEFAULT_AGGREGATE_ENDPOINT;

  return {
    enabled: readBoolFlag(enabledFlag, false),
    aggregateEnabled: readBoolFlag(aggregateFlag, false),
    ga4Enabled: readBoolFlag(ga4Flag, false),
    childPrivacyApproved: readBoolFlag(approvedFlag, false),
    ga4MeasurementId: measurementId,
    aggregateEndpoint: endpoint,
    debug: readBoolFlag(debugFlag, isDev),
    dedupeWindowMs: DEFAULT_DEDUPE_WINDOW_MS,
    ...overrides,
  };
}

/**
 * Child-safe baseline settings for GA4 when explicitly approved on marketing pages.
 * Disables automatic page views, Google Signals, ad personalization, and cookie storage.
 */
export const GA4_CHILD_SAFE_CONFIG = {
  send_page_view: false,
  allow_google_signals: false,
  allow_ad_personalization_signals: false,
  restricted_data_processing: true,
  anonymize_ip: true,
  client_storage: 'none',
} as const;

export const GA4_DENIED_CONSENT_DEFAULTS = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
} as const;
