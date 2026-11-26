export const ANALYTICS_EVENT_NAMES = [
  'game_started',
  'game_completed',
  'game_restarted',
  'level_completed',
  'game_exited',
  'difficulty_selected',
  'drawing_started',
  'drawing_saved',
  'drawing_exported',
  'brush_selected',
  'coloring_started',
  'coloring_completed',
  'template_selected',
  'subject_selected',
  'practice_started',
  'practice_completed',
  'tracing_completed',
  'worksheet_downloaded',
  'worksheet_printed',
  'badge_earned',
  'achievement_unlocked',
  'section_viewed',
  'activity_selected',
  'feature_used',
  'theme_changed',
  'language_changed',
];

export const EVENT_PARAM_ALLOWLIST = {
  game_started: ['game_id', 'difficulty', 'template_id', 'is_restart'],
  game_completed: ['game_id', 'difficulty', 'template_id', 'score_band', 'duration_bucket', 'moves_bucket'],
  game_restarted: ['game_id', 'difficulty', 'reason'],
  level_completed: ['game_id', 'level', 'scene_id'],
  game_exited: ['game_id', 'difficulty', 'exit_reason'],
  difficulty_selected: ['game_id', 'difficulty'],
  drawing_started: ['board_mode', 'template_category', 'brush_id'],
  drawing_saved: ['board_mode', 'template_category', 'template_id'],
  drawing_exported: ['board_mode', 'export_format', 'template_category'],
  brush_selected: ['brush_id', 'board_mode'],
  coloring_started: ['board_mode', 'template_category', 'template_id', 'brush_id'],
  coloring_completed: ['board_mode', 'template_category', 'template_id'],
  template_selected: ['template_category', 'template_id', 'board_mode'],
  subject_selected: ['subject_id', 'source_section'],
  practice_started: ['subject_id', 'topic_id', 'practice_mode', 'practice_set_id', 'question_count'],
  practice_completed: ['subject_id', 'topic_id', 'practice_mode', 'score_band', 'duration_bucket', 'passed'],
  tracing_completed: ['template_category', 'template_id', 'progress_pct'],
  worksheet_downloaded: ['export_format', 'template_category', 'template_id'],
  worksheet_printed: ['board_mode', 'template_category', 'entry_count'],
  badge_earned: ['badge_id', 'source_activity'],
  achievement_unlocked: ['achievement_id', 'source_activity'],
  section_viewed: ['section_id', 'subject_id'],
  activity_selected: ['activity_type', 'activity_id', 'source_section'],
  feature_used: ['feature_id', 'section_id'],
  theme_changed: ['theme_id', 'section_id'],
  language_changed: ['language_code'],
};

const EVENT_SET = new Set(ANALYTICS_EVENT_NAMES);
const SAFE_SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const PII_SUSPECT_PATTERN = /(@|https?:\/\/|\?|=|\d{7,})/;

export const MAX_EVENTS_PER_BATCH = 10;
export const MAX_BODY_BYTES = 4096;

export function sanitizeServerEvent(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!EVENT_SET.has(name)) {
    return null;
  }

  const allowed = EVENT_PARAM_ALLOWLIST[name];
  const rawParams = raw.params && typeof raw.params === 'object' && !Array.isArray(raw.params)
    ? raw.params
    : {};

  const params = {};
  for (const [key, value] of Object.entries(rawParams)) {
    if (!allowed.includes(key) || value === undefined || value === null) {
      continue;
    }
    if (typeof value === 'boolean') {
      params[key] = value;
    } else if (typeof value === 'number') {
      if (Number.isFinite(value) && value >= 0 && value <= 100000) {
        params[key] = Math.round(value);
      } else {
        return null;
      }
    } else if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (
        normalized.length > 0 &&
        normalized.length <= 64 &&
        SAFE_SLUG_PATTERN.test(normalized) &&
        !PII_SUSPECT_PATTERN.test(normalized)
      ) {
        params[key] = normalized;
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  return { name, params };
}

export function validateBatchPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, error: 'Invalid payload envelope' };
  }
  if (!Array.isArray(payload.events) || payload.events.length === 0 || payload.events.length > MAX_EVENTS_PER_BATCH) {
    return { ok: false, error: 'Batch size out of range' };
  }

  const validEvents = [];
  for (const item of payload.events) {
    const clean = sanitizeServerEvent(item);
    if (!clean) {
      return { ok: false, error: 'Event failed schema or privacy validation' };
    }
    validEvents.push(clean);
  }
  return { ok: true, events: validEvents };
}

/**
 * Converts a single validated event into flat atomic aggregate counter increments.
 * Stores no timestamps per event, no user identifiers, and no raw free text.
 */
export function extractCounterIncrements(event) {
  const { name, params } = event;
  const increments = {
    [`ev|${name}`]: 1,
  };

  if (typeof params.game_id === 'string') {
    increments[`dim|game|${params.game_id}|${name}`] = 1;
    if (typeof params.difficulty === 'string') {
      increments[`dim|game_diff|${params.game_id}:${params.difficulty}|${name}`] = 1;
    }
  }

  if (typeof params.brush_id === 'string' && name === 'brush_selected') {
    increments[`dim|brush|${params.brush_id}|brush_selected`] = 1;
  }

  if (typeof params.board_mode === 'string') {
    increments[`dim|board_mode|${params.board_mode}|${name}`] = 1;
  }

  if (typeof params.subject_id === 'string' && name !== 'section_viewed') {
    increments[`dim|subject|${params.subject_id}|${name}`] = 1;
  }

  if (typeof params.practice_mode === 'string') {
    increments[`dim|practice_mode|${params.practice_mode}|${name}`] = 1;
  }

  if (typeof params.template_category === 'string' && typeof params.template_id === 'string') {
    increments[`dim|template|${params.template_category}:${params.template_id}|${name}`] = 1;
  }

  if (name === 'worksheet_downloaded' && typeof params.export_format === 'string') {
    increments[`dim|worksheet_fmt|${params.export_format}|worksheet_downloaded`] = 1;
  }

  if (name === 'worksheet_printed' && typeof params.template_category === 'string') {
    increments[`dim|worksheet_cat|${params.template_category}|worksheet_printed`] = 1;
  }

  if (name === 'section_viewed' && typeof params.section_id === 'string') {
    increments[`dim|section|${params.section_id}|section_viewed`] = 1;
  }

  if (name === 'feature_used' && typeof params.feature_id === 'string') {
    increments[`dim|feature|${params.feature_id}|feature_used`] = 1;
  }

  if (name === 'theme_changed' && typeof params.theme_id === 'string') {
    increments[`dim|theme|${params.theme_id}|theme_changed`] = 1;
  }

  return increments;
}

