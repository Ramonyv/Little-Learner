export {
  loadAnalyticsConfig,
  GA4_CHILD_SAFE_CONFIG,
  GA4_DENIED_CONSENT_DEFAULTS,
  PARENT_MARKETING_SECTIONS,
  type AnalyticsConfig,
} from './config';
export { AggregateTransport } from './aggregateTransport';
export {
  ANALYTICS_EVENT_NAMES,
  EVENT_PARAM_ALLOWLIST,
  sanitizeEventParams,
  toDurationBucket,
  toSafeSlug,
  toScoreBand,
  type AchievementId,
  type AnalyticsEventName,
  type AnalyticsEventPayloadMap,
  type BadgeId,
  type BoardModeId,
  type BrushId,
  type DifficultyId,
  type DurationBucket,
  type ExportFormatId,
  type FeatureId,
  type GameId,
  type LanguageCode,
  type ParamPrimitive,
  type PracticeModeSlug,
  type ScoreBand,
  type SectionId,
  type SubjectSlug,
  type TemplateCategoryId,
  type ThemeId,
} from './events';
export { Ga4Transport, isEventAllowedForGa4, type AnalyticsTransport } from './ga4Transport';
export {
  AnalyticsService,
  analytics,
  createAnalyticsService,
  type RecordedAnalyticsEvent,
  type TrackOptions,
} from './service';
export { resolveSectionFromPathname, useSectionTracking } from './useSectionTracking';

