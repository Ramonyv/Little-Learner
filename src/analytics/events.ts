export const ANALYTICS_EVENT_NAMES = [
  // Games
  'game_started',
  'game_completed',
  'game_restarted',
  'level_completed',
  'game_exited',
  'difficulty_selected',
  // Drawing and creativity
  'drawing_started',
  'drawing_saved',
  'drawing_exported',
  'brush_selected',
  'coloring_started',
  'coloring_completed',
  'template_selected',
  // Education
  'subject_selected',
  'practice_started',
  'practice_completed',
  'tracing_completed',
  'worksheet_downloaded',
  'worksheet_printed',
  // Achievements
  'badge_earned',
  'achievement_unlocked',
  // Product navigation
  'section_viewed',
  'activity_selected',
  'feature_used',
  'theme_changed',
  'language_changed',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[number];

export type GameId = 'sliding_puzzle' | 'hanuman_runner';
export type DifficultyId = '3x3' | '4x4' | '5x5' | 'classic' | '3d';
export type BoardModeId = 'trace' | 'free_draw' | 'gods' | 'worksheet';
export type ExportFormatId = 'pdf' | 'jpg' | 'json';
export type SubjectSlug = 'english' | 'mathematics' | 'science' | 'general-knowledge';
export type PracticeModeSlug = 'practice' | 'exam' | 'mistakes_revision' | 'explore_seed';
export type ScoreBand = '90_plus' | '75_89' | '50_74' | 'under_50';
export type DurationBucket = 'under_30s' | '30s_to_2m' | '2m_to_5m' | 'over_5m';

export type BrushId =
  | 'pencil'
  | 'pen'
  | 'fountain_pen'
  | 'monoline'
  | 'chalk'
  | 'reed'
  | 'marker'
  | 'crayon'
  | 'ink'
  | 'brush'
  | 'watercolor'
  | 'eraser'
  | 'rainbow'
  | 'fill';

export type TemplateCategoryId =
  | 'letters'
  | 'numbers'
  | 'words'
  | 'shapes'
  | 'pictures'
  | 'lines_curves'
  | 'gods'
  | 'puzzle_picture'
  | 'free_draw'
  | 'custom_worksheet'
  | 'science_seed';

export type SectionId =
  | 'home'
  | 'games'
  | 'sliding_puzzle'
  | 'hanuman_runner'
  | 'drawing_board'
  | 'topics'
  | 'exam_intro'
  | 'exam_session'
  | 'progress'
  | 'learning_tools'
  | 'my_work'
  | 'explore_seed'
  | 'information'
  | 'contact'
  | 'about';

export type FeatureId =
  | 'hint'
  | 'sound_on'
  | 'sound_off'
  | 'read_aloud_on'
  | 'read_aloud_off'
  | 'fullscreen_on'
  | 'fullscreen_off'
  | 'undo'
  | 'redo'
  | 'clear_canvas'
  | 'trace_image_guide'
  | 'answer_review'
  | 'retry_mistakes'
  | 'backup_export'
  | 'view_mode_grid'
  | 'view_mode_list'
  | 'pause'
  | 'resume'
  | 'print_board'
  | 'print_trace';

export type ThemeId = 'whiteboard' | 'chalkboard' | 'runner_classic' | 'runner_3d' | 'light' | 'dark';
export type LanguageCode = 'en' | 'en-in' | 'hi';

export type BadgeId =
  | 'awesome_champion'
  | 'super_work'
  | 'great_effort'
  | 'good_try'
  | 'puzzle_star_1'
  | 'puzzle_star_2'
  | 'puzzle_star_3';

export type AchievementId =
  | 'first_practice_complete'
  | 'champion_score'
  | 'puzzle_master_1'
  | 'puzzle_master_2'
  | 'puzzle_master_3'
  | 'runner_scene_cleared'
  | 'runner_new_best'
  | 'seed_explorer_complete';

export type ParamPrimitive = string | number | boolean;

export interface AnalyticsEventPayloadMap {
  game_started: {
    game_id: GameId;
    difficulty?: DifficultyId;
    template_id?: string;
    is_restart?: boolean;
  };
  game_completed: {
    game_id: GameId;
    difficulty?: DifficultyId;
    template_id?: string;
    score_band?: ScoreBand;
    duration_bucket?: DurationBucket;
    moves_bucket?: string;
  };
  game_restarted: {
    game_id: GameId;
    difficulty?: DifficultyId;
    reason?: 'reset' | 'shuffle' | 'restart_run' | 'picture_change';
  };
  level_completed: {
    game_id: GameId;
    level: number;
    scene_id?: string;
  };
  game_exited: {
    game_id: GameId;
    difficulty?: DifficultyId;
    exit_reason?: 'navigation' | 'switch_style';
  };
  difficulty_selected: {
    game_id: GameId;
    difficulty: DifficultyId;
  };
  drawing_started: {
    board_mode: BoardModeId;
    template_category?: TemplateCategoryId;
    brush_id?: BrushId;
  };
  drawing_saved: {
    board_mode: BoardModeId;
    template_category?: TemplateCategoryId;
    template_id?: string;
  };
  drawing_exported: {
    board_mode?: BoardModeId | 'backup';
    export_format: ExportFormatId;
    template_category?: TemplateCategoryId;
  };
  brush_selected: {
    brush_id: BrushId;
    board_mode: BoardModeId;
  };
  coloring_started: {
    board_mode: 'gods';
    template_category: 'gods';
    template_id?: string;
    brush_id?: BrushId;
  };
  coloring_completed: {
    board_mode: 'gods';
    template_category: 'gods';
    template_id?: string;
  };
  template_selected: {
    template_category: TemplateCategoryId;
    template_id: string;
    board_mode?: BoardModeId;
  };
  subject_selected: {
    subject_id: SubjectSlug;
    source_section?: SectionId;
  };
  practice_started: {
    subject_id: SubjectSlug;
    topic_id: string;
    practice_mode: PracticeModeSlug;
    practice_set_id?: string;
    question_count?: number;
  };
  practice_completed: {
    subject_id: SubjectSlug;
    topic_id: string;
    practice_mode: PracticeModeSlug;
    score_band: ScoreBand;
    duration_bucket: DurationBucket;
    passed?: boolean;
  };
  tracing_completed: {
    template_category: TemplateCategoryId;
    template_id: string;
    progress_pct?: number;
  };
  worksheet_downloaded: {
    export_format: ExportFormatId;
    template_category: TemplateCategoryId;
    template_id?: string;
  };
  worksheet_printed: {
    board_mode?: BoardModeId;
    template_category: TemplateCategoryId;
    entry_count?: number;
  };
  badge_earned: {
    badge_id: BadgeId;
    source_activity: string;
  };
  achievement_unlocked: {
    achievement_id: AchievementId;
    source_activity: string;
  };
  section_viewed: {
    section_id: SectionId;
    subject_id?: SubjectSlug;
  };
  activity_selected: {
    activity_type: 'game' | 'drawing' | 'education' | 'explore';
    activity_id: string;
    source_section?: SectionId;
  };
  feature_used: {
    feature_id: FeatureId;
    section_id?: SectionId;
  };
  theme_changed: {
    theme_id: ThemeId;
    section_id?: SectionId;
  };
  language_changed: {
    language_code: LanguageCode;
  };
}

export const EVENT_PARAM_ALLOWLIST: Record<AnalyticsEventName, readonly string[]> = {
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

const SAFE_SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const PII_SUSPECT_PATTERN = /(@|https?:\/\/|\?|=|\d{7,})/;

export function isValidAnalyticsEventName(name: string): name is AnalyticsEventName {
  return (ANALYTICS_EVENT_NAMES as readonly string[]).includes(name);
}

/** Converts known predefined strings into lowercase snake_case activity/template IDs. */
export function toSafeSlug(input: string, fallback = 'unknown'): string {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9-]+/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '')
    .slice(0, 64);
  return SAFE_SLUG_PATTERN.test(normalized) ? normalized : fallback;
}

export function toDurationBucket(seconds: number): DurationBucket {
  if (!Number.isFinite(seconds) || seconds < 30) return 'under_30s';
  if (seconds < 120) return '30s_to_2m';
  if (seconds < 300) return '2m_to_5m';
  return 'over_5m';
}

export function toScoreBand(percentage: number): ScoreBand {
  if (!Number.isFinite(percentage) || percentage < 50) return 'under_50';
  if (percentage < 75) return '50_74';
  if (percentage < 90) return '75_89';
  return '90_plus';
}

export function sanitizeEventParams<K extends AnalyticsEventName>(
  eventName: K,
  rawParams: Record<string, unknown> | undefined,
): { params: Record<string, ParamPrimitive>; droppedKeys: string[] } {
  const allowed = EVENT_PARAM_ALLOWLIST[eventName];
  const params: Record<string, ParamPrimitive> = {};
  const droppedKeys: string[] = [];

  if (!rawParams || typeof rawParams !== 'object') {
    return { params, droppedKeys };
  }

  for (const [key, value] of Object.entries(rawParams)) {
    if (!allowed.includes(key) || value === undefined || value === null) {
      if (value !== undefined && value !== null) droppedKeys.push(key);
      continue;
    }

    if (typeof value === 'boolean') {
      params[key] = value;
      continue;
    }

    if (typeof value === 'number') {
      if (Number.isFinite(value) && value >= 0 && value <= 100000) {
        params[key] = Math.round(value);
      } else {
        droppedKeys.push(key);
      }
      continue;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (
        normalized.length > 0 &&
        normalized.length <= 64 &&
        SAFE_SLUG_PATTERN.test(normalized) &&
        !PII_SUSPECT_PATTERN.test(normalized)
      ) {
        params[key] = normalized;
      } else {
        droppedKeys.push(key);
      }
      continue;
    }

    droppedKeys.push(key);
  }

  return { params, droppedKeys };
}
