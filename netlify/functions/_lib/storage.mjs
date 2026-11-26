const KEY_PREFIX = 'jugnu:agg:v1:';
const RETENTION_SECONDS = 400 * 24 * 60 * 60; // 400 days aggregate-only retention

const sharedMemoryStore = new Map();

export function toUtcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function getRecentUtcDateKeys(days, endDate = new Date()) {
  const keys = [];
  const base = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());
  for (let i = days - 1; i >= 0; i--) {
    keys.push(new Date(base - i * 86_400_000).toISOString().slice(0, 10));
  }
  return keys;
}

function normalizeRedisHashArray(result) {
  const map = {};
  if (!Array.isArray(result)) return map;
  for (let i = 0; i < result.length; i += 2) {
    const field = result[i];
    const value = Number(result[i + 1] ?? 0);
    if (typeof field === 'string' && Number.isFinite(value) && value > 0) {
      map[field] = value;
    }
  }
  return map;
}

class UpstashAggregateStore {
  constructor(url, token) {
    this.url = url.replace(/\/+$/, '');
    this.token = token;
    this.kind = 'upstash-redis';
  }

  async pipeline(commands) {
    const response = await fetch(`${this.url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });
    if (!response.ok) {
      throw new Error(`Upstash pipeline HTTP ${response.status}`);
    }
    return response.json();
  }

  async incrementDay(dateKey, increments) {
    const hashKey = `${KEY_PREFIX}${dateKey}`;
    const commands = Object.entries(increments).map(([field, delta]) => [
      'HINCRBY',
      hashKey,
      field,
      String(delta),
    ]);
    if (commands.length === 0) return;
    commands.push(['EXPIRE', hashKey, String(RETENTION_SECONDS)]);
    await this.pipeline(commands);
  }

  async readDays(dateKeys) {
    if (dateKeys.length === 0) return {};
    const commands = dateKeys.map((day) => ['HGETALL', `${KEY_PREFIX}${day}`]);
    const results = await this.pipeline(commands);
    const byDay = {};
    dateKeys.forEach((day, idx) => {
      byDay[day] = normalizeRedisHashArray(results?.[idx]?.result);
    });
    return byDay;
  }
}

class MemoryAggregateStore {
  constructor(storeMap = sharedMemoryStore) {
    this.store = storeMap;
    this.kind = 'memory-dev';
  }

  async incrementDay(dateKey, increments) {
    const current = this.store.get(dateKey) ?? {};
    for (const [field, delta] of Object.entries(increments)) {
      current[field] = (current[field] || 0) + delta;
    }
    this.store.set(dateKey, current);
  }

  async readDays(dateKeys) {
    const byDay = {};
    for (const day of dateKeys) {
      byDay[day] = { ...(this.store.get(day) ?? {}) };
    }
    return byDay;
  }
}

export function createAggregateStore(env = process.env, customMemoryMap) {
  if (customMemoryMap) {
    return new MemoryAggregateStore(customMemoryMap);
  }
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return new UpstashAggregateStore(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN);
  }
  const isProd = env.NODE_ENV === 'production' || env.CONTEXT === 'production';
  if (!isProd || env.JUGNU_ALLOW_MEMORY_STORAGE === 'true') {
    return new MemoryAggregateStore();
  }
  return null;
}

function sumCounts(maps, prefix, eventFilter) {
  const totals = {};
  for (const map of maps) {
    for (const [key, value] of Object.entries(map)) {
      if (!key.startsWith(prefix)) continue;
      const parts = key.split('|');
      // format: dim|<dimName>|<dimValue>|<eventName>
      const dimValue = parts[2];
      const evName = parts[3];
      if (eventFilter && evName !== eventFilter) continue;
      totals[dimValue] = (totals[dimValue] || 0) + value;
    }
  }
  return Object.entries(totals)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);
}

function getEventTotal(maps, eventName) {
  const key = `ev|${eventName}`;
  let sum = 0;
  for (const map of maps) {
    sum += map[key] || 0;
  }
  return sum;
}

function computeRatePair(starts, completions, exits) {
  if (starts <= 0) {
    return {
      starts: 0,
      completions,
      exits,
      completionRatePct: null,
      abandonmentRatePct: null,
    };
  }
  const completionRatePct = Math.min(100, Math.round((completions / starts) * 100));
  const abandonmentRatePct =
    typeof exits === 'number'
      ? Math.min(100, Math.round((exits / starts) * 100))
      : Math.max(0, 100 - completionRatePct);
  return {
    starts,
    completions,
    ...(typeof exits === 'number' ? { exits } : {}),
    completionRatePct,
    abandonmentRatePct,
  };
}

function computeDayTotals(map) {
  const starts =
    (map['ev|game_started'] || 0) +
    (map['ev|practice_started'] || 0) +
    (map['ev|drawing_started'] || 0) +
    (map['ev|coloring_started'] || 0);
  const completions =
    (map['ev|game_completed'] || 0) +
    (map['ev|practice_completed'] || 0) +
    (map['ev|tracing_completed'] || 0) +
    (map['ev|coloring_completed'] || 0);
  const views = map['ev|section_viewed'] || 0;
  return { starts, completions, views };
}

export function buildInsightsSummary(byDay, range = 'weekly') {
  const allDays = Object.keys(byDay).sort();
  const windowDaysCount = range === 'daily' ? 1 : range === 'monthly' ? 30 : 7;
  const activeDayKeys = allDays.slice(-windowDaysCount);
  const maps = activeDayKeys.map((d) => byDay[d] ?? {});

  const gameStarts = getEventTotal(maps, 'game_started');
  const gameCompletions = getEventTotal(maps, 'game_completed');
  const gameExits = getEventTotal(maps, 'game_exited');
  const practiceStarts = getEventTotal(maps, 'practice_started');
  const practiceCompletions = getEventTotal(maps, 'practice_completed');
  const drawingStarts = getEventTotal(maps, 'drawing_started');
  const drawingSaves = getEventTotal(maps, 'drawing_saved');
  const drawingExports = getEventTotal(maps, 'drawing_exported');
  const tracingCompletions = getEventTotal(maps, 'tracing_completed');
  const coloringStarts = getEventTotal(maps, 'coloring_started');
  const coloringCompletions = getEventTotal(maps, 'coloring_completed');
  const worksheetDownloads = getEventTotal(maps, 'worksheet_downloaded');
  const worksheetPrints = getEventTotal(maps, 'worksheet_printed');

  const totalStarts = gameStarts + practiceStarts + drawingStarts + coloringStarts;
  const totalCompletions =
    gameCompletions + practiceCompletions + tracingCompletions + coloringCompletions;

  // Game breakdown (starts + completions + exits per game_id)
  const gameStartRows = sumCounts(maps, 'dim|game|', 'game_started');
  const gameCompRows = Object.fromEntries(
    sumCounts(maps, 'dim|game|', 'game_completed').map((r) => [r.id, r.count]),
  );
  const gameExitRows = Object.fromEntries(
    sumCounts(maps, 'dim|game|', 'game_exited').map((r) => [r.id, r.count]),
  );
  const games = gameStartRows.map((row) => ({
    id: row.id,
    starts: row.count,
    completions: gameCompRows[row.id] || 0,
    exits: gameExitRows[row.id] || 0,
    ...computeRatePair(row.count, gameCompRows[row.id] || 0, gameExitRows[row.id] || 0),
  }));

  // Subjects breakdown
  const subjectSelects = Object.fromEntries(
    sumCounts(maps, 'dim|subject|', 'subject_selected').map((r) => [r.id, r.count]),
  );
  const subjectStarts = Object.fromEntries(
    sumCounts(maps, 'dim|subject|', 'practice_started').map((r) => [r.id, r.count]),
  );
  const subjectCompletions = Object.fromEntries(
    sumCounts(maps, 'dim|subject|', 'practice_completed').map((r) => [r.id, r.count]),
  );
  const subjectIds = Array.from(
    new Set([...Object.keys(subjectSelects), ...Object.keys(subjectStarts), ...Object.keys(subjectCompletions)]),
  );
  const subjects = subjectIds
    .map((id) => {
      const starts = subjectStarts[id] || 0;
      const completions = subjectCompletions[id] || 0;
      return {
        id,
        views: subjectSelects[id] || 0,
        starts,
        completions,
        ...computeRatePair(starts, completions),
      };
    })
    .sort((a, b) => (b.starts + b.views) - (a.starts + a.views));

  // Coloring templates
  const coloringTemplates = sumCounts(maps, 'dim|template|', 'coloring_started')
    .concat(sumCounts(maps, 'dim|template|', 'template_selected'))
    .reduce((acc, item) => {
      if (!item.id.startsWith('gods:')) return acc;
      const name = item.id.slice(5);
      acc[name] = (acc[name] || 0) + item.count;
      return acc;
    }, {});
  const popularColoringTemplates = Object.entries(coloringTemplates)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);

  // Daily trend (up to 30 recent days)
  const dailyTrend = allDays.slice(-30).map((date) => ({
    label: date,
    ...computeDayTotals(byDay[date] ?? {}),
  }));

  // Weekly trend (grouped in 7-day buckets across returned days)
  const weeklyTrend = [];
  for (let i = 0; i < allDays.length; i += 7) {
    const slice = allDays.slice(i, i + 7);
    if (!slice.length) continue;
    const agg = slice.reduce(
      (acc, day) => {
        const d = computeDayTotals(byDay[day] ?? {});
        return { starts: acc.starts + d.starts, completions: acc.completions + d.completions, views: acc.views + d.views };
      },
      { starts: 0, completions: 0, views: 0 },
    );
    weeklyTrend.push({ label: `${slice[0]}..${slice[slice.length - 1].slice(5)}`, ...agg });
  }

  // Monthly trend (grouped by YYYY-MM)
  const monthGroups = {};
  for (const day of allDays) {
    const month = day.slice(0, 7);
    const d = computeDayTotals(byDay[day] ?? {});
    const prev = monthGroups[month] || { starts: 0, completions: 0, views: 0 };
    monthGroups[month] = {
      starts: prev.starts + d.starts,
      completions: prev.completions + d.completions,
      views: prev.views + d.views,
    };
  }
  const monthlyTrend = Object.entries(monthGroups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, metrics]) => ({ label, ...metrics }));

  return {
    range,
    windowDays: activeDayKeys,
    privacyMode: 'aggregate_only_no_pii',
    totals: {
      activityStarts: totalStarts,
      activityCompletions: totalCompletions,
      sectionViews: getEventTotal(maps, 'section_viewed'),
      worksheetDownloads,
      worksheetPrints,
      drawingSaves,
      drawingExports,
    },
    rates: {
      overall: computeRatePair(totalStarts, totalCompletions),
      games: computeRatePair(gameStarts, gameCompletions, gameExits),
      practice: computeRatePair(practiceStarts, practiceCompletions),
      coloring: computeRatePair(coloringStarts, coloringCompletions),
      drawingAndTracing: computeRatePair(drawingStarts, drawingSaves + tracingCompletions),
    },
    mostPlayedGames: games,
    popularDrawingTools: sumCounts(maps, 'dim|brush|', 'brush_selected'),
    popularBoardModes: sumCounts(maps, 'dim|board_mode|'),
    popularSubjects: subjects,
    popularColoringTemplates,
    popularTemplates: sumCounts(maps, 'dim|template|', 'template_selected'),
    worksheetFormats: sumCounts(maps, 'dim|worksheet_fmt|', 'worksheet_downloaded'),
    worksheetCategories: sumCounts(maps, 'dim|worksheet_cat|', 'worksheet_printed'),
    sectionPopularity: sumCounts(maps, 'dim|section|', 'section_viewed'),
    popularFeatures: sumCounts(maps, 'dim|feature|', 'feature_used'),
    trends: {
      daily: dailyTrend,
      weekly: weeklyTrend.slice(-12),
      monthly: monthlyTrend.slice(-12),
    },
  };
}

