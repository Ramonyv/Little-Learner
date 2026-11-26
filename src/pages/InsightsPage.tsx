import React, { useCallback, useEffect, useState } from 'react';

type RangeKey = 'daily' | 'weekly' | 'monthly';

interface CountItem {
  id: string;
  count: number;
}

interface GameRow {
  id: string;
  starts: number;
  completions: number;
  exits: number;
  completionRatePct: number | null;
  abandonmentRatePct: number | null;
}

interface SubjectRow {
  id: string;
  views: number;
  starts: number;
  completions: number;
  completionRatePct: number | null;
  abandonmentRatePct: number | null;
}

interface RateMetric {
  starts: number;
  completions: number;
  exits?: number;
  completionRatePct: number | null;
  abandonmentRatePct: number | null;
}

interface TrendBucket {
  label: string;
  starts: number;
  completions: number;
  views: number;
}

export interface InsightsSummary {
  range: RangeKey;
  windowDays: string[];
  privacyMode: string;
  storageBackend?: string;
  collectionEnabled?: boolean;
  totals: {
    activityStarts: number;
    activityCompletions: number;
    sectionViews: number;
    worksheetDownloads: number;
    worksheetPrints: number;
    drawingSaves: number;
    drawingExports: number;
  };
  rates: {
    overall: RateMetric;
    games: RateMetric;
    practice: RateMetric;
    coloring: RateMetric;
    drawingAndTracing: RateMetric;
  };
  mostPlayedGames: GameRow[];
  popularDrawingTools: CountItem[];
  popularBoardModes: CountItem[];
  popularSubjects: SubjectRow[];
  popularColoringTemplates: CountItem[];
  popularTemplates: CountItem[];
  worksheetFormats: CountItem[];
  worksheetCategories: CountItem[];
  sectionPopularity: CountItem[];
  popularFeatures: CountItem[];
  trends: {
    daily: TrendBucket[];
    weekly: TrendBucket[];
    monthly: TrendBucket[];
  };
}

function formatSlug(slug: string): string {
  return slug
    .replace(/^deity_/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function formatPct(value: number | null): string {
  return value === null ? '—' : `${value}%`;
}

function HorizontalBarList({
  items,
  emptyLabel,
  barColor = 'bg-brand-blue',
}: {
  items: CountItem[];
  emptyLabel: string;
  barColor?: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm font-semibold text-slate-500 py-3">{emptyLabel}</p>;
  }
  const max = Math.max(1, ...items.map((item) => item.count));
  return (
    <ul className="space-y-3">
      {items.slice(0, 10).map((item) => {
        const widthPct = Math.max(4, Math.round((item.count / max) * 100));
        return (
          <li key={item.id}>
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold mb-1 gap-2">
              <span className="text-brand-ink truncate">{formatSlug(item.id)}</span>
              <span className="text-slate-600 tabular-nums">{item.count.toLocaleString()}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${widthPct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function TrendChart({ buckets, range }: { buckets: TrendBucket[]; range: RangeKey }) {
  if (buckets.length === 0) {
    return <p className="text-sm font-semibold text-slate-500 py-6">No trend data recorded yet.</p>;
  }

  const maxVal = Math.max(1, ...buckets.flatMap((b) => [b.starts, b.completions]));
  const barWidth = Math.max(14, Math.min(36, Math.floor(620 / Math.max(1, buckets.length))));
  const gap = 10;
  const chartWidth = Math.max(360, buckets.length * (barWidth * 2 + gap));
  const chartHeight = 160;

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight + 36}`}
        className="w-full min-w-[340px] h-52"
        role="img"
        aria-label={`${range} activity trends comparing starts and completions`}
      >
        {buckets.map((bucket, index) => {
          const x = index * (barWidth * 2 + gap);
          const startH = Math.round((bucket.starts / maxVal) * (chartHeight - 16));
          const compH = Math.round((bucket.completions / maxVal) * (chartHeight - 16));
          const shortLabel =
            range === 'daily'
              ? bucket.label.slice(5)
              : bucket.label.length > 12
                ? bucket.label.slice(5)
                : bucket.label;
          return (
            <g key={bucket.label}>
              <rect
                x={x}
                y={chartHeight - startH}
                width={barWidth - 2}
                height={Math.max(2, startH)}
                rx="4"
                fill="#087CF7"
              />
              <rect
                x={x + barWidth}
                y={chartHeight - compH}
                width={barWidth - 2}
                height={Math.max(2, compH)}
                rx="4"
                fill="#20C86B"
              />
              <text
                x={x + barWidth - 1}
                y={chartHeight + 18}
                textAnchor="middle"
                fontSize="10"
                fill="#475569"
                fontWeight="700"
              >
                {shortLabel}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-5 text-xs font-bold text-slate-600 mt-1">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#087CF7] inline-block" /> Starts
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#20C86B] inline-block" /> Completions
        </span>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const [authState, setAuthState] = useState<'checking' | 'signed_out' | 'signed_in'>('checking');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [range, setRange] = useState<RangeKey>('weekly');
  const [data, setData] = useState<InsightsSummary | null>(null);
  const [dataError, setDataError] = useState('');
  const [loadingData, setLoadingData] = useState(false);

  const loadSummary = useCallback(async (selectedRange: RangeKey) => {
    setLoadingData(true);
    setDataError('');
    try {
      const response = await fetch(`/.netlify/functions/insights-data?range=${selectedRange}`, {
        method: 'GET',
        credentials: 'same-origin',
      });
      if (response.status === 401) {
        setAuthState('signed_out');
        setData(null);
        return;
      }
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const msg = body.details ? `${body.error || 'Error'}: ${body.details}` : (body.error || `Server returned ${response.status}`);
        setDataError(msg);
        return;
      }
      const summary = (await response.json()) as InsightsSummary;
      setData(summary);
    } catch {
      setDataError('Could not reach analytics endpoint.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/.netlify/functions/insights-auth', {
      method: 'GET',
      credentials: 'same-origin',
    })
      .then((res) => {
        if (!active) return;
        if (res.ok) {
          setAuthState('signed_in');
          void loadSummary(range);
        } else {
          setAuthState('signed_out');
        }
      })
      .catch(() => {
        if (active) setAuthState('signed_out');
      });
    return () => {
      active = false;
    };
  }, [loadSummary, range]);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    if (!password.trim()) {
      setAuthError('Enter the owner passphrase.');
      return;
    }
    setSubmitting(true);
    setAuthError('');
    try {
      const response = await fetch('/.netlify/functions/insights-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'login', password }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.authenticated) {
        setAuthError(body.error || 'Authentication failed.');
        return;
      }
      setPassword('');
      setAuthState('signed_in');
      void loadSummary(range);
    } catch {
      setAuthError('Unable to reach auth endpoint.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch('/.netlify/functions/insights-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ action: 'logout' }),
      });
    } finally {
      setAuthState('signed_out');
      setData(null);
    }
  }

  if (authState === 'checking') {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-8 text-center max-w-md w-full">
          <h1 className="text-2xl font-black text-brand-ink">Jugnu Insights</h1>
          <p className="text-sm font-bold text-slate-500 mt-2">Checking owner session…</p>
        </div>
      </main>
    );
  }

  if (authState === 'signed_out') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50">
        <section
          aria-labelledby="insights-login-title"
          className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 sm:p-8 max-w-md w-full"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-brand-blue text-xs font-black uppercase tracking-wider mb-3">
            Private Owner Dashboard
          </span>
          <h1 id="insights-login-title" className="text-2xl sm:text-3xl font-black text-brand-ink">
            Jugnu Insights
          </h1>
          <p className="text-sm font-bold text-slate-500 mt-1.5 mb-6">
            Aggregate-only product analytics. Sign in to view anonymized counts — zero personal data or child histories are stored.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block text-sm font-extrabold text-brand-ink">
              Owner passphrase
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border-2 border-slate-200 px-3.5 py-2.5 text-base font-bold focus:border-brand-blue focus:outline-none"
                placeholder="Enter dashboard passphrase"
              />
            </label>
            {authError && (
              <p role="alert" className="text-sm font-bold text-rose-600">
                {authError}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-full bg-brand-blue hover:bg-brand-blue-hover text-white font-black text-base transition-colors disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Open Jugnu Insights'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  const trendSeries =
    range === 'daily'
      ? data?.trends.daily ?? []
      : range === 'monthly'
        ? data?.trends.monthly ?? []
        : data?.trends.weekly ?? [];

  return (
    <main className="min-h-screen bg-slate-50 py-6 sm:py-10 px-4 sm:px-6 pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Dashboard Header */}
        <header className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase">
                Aggregate Only · No PII
              </span>
              {data?.storageBackend && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-black">
                  Store: {data.storageBackend}
                </span>
              )}
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                  data?.collectionEnabled
                    ? 'bg-blue-50 text-brand-blue'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                Collection: {data?.collectionEnabled ? 'Active' : 'Paused / Review'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-ink">Jugnu Insights</h1>
            <p className="text-xs sm:text-sm font-bold text-slate-500">
              Anonymous product usage rollups across games, drawing tools, subjects, and worksheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Time range" className="inline-flex rounded-full bg-slate-100 p-1">
              {(['daily', 'weekly', 'monthly'] as RangeKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={range === key}
                  onClick={() => setRange(key)}
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black capitalize transition-colors ${
                    range === key
                      ? 'bg-brand-blue text-white'
                      : 'text-slate-600 hover:text-brand-ink'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void loadSummary(range)}
              disabled={loadingData}
              className="px-3.5 py-2 rounded-full border-2 border-slate-200 bg-white text-xs font-black text-slate-700 hover:border-brand-blue"
            >
              {loadingData ? 'Refreshing…' : 'Refresh'}
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="px-3.5 py-2 rounded-full border-2 border-slate-200 bg-white text-xs font-black text-rose-700 hover:border-rose-300"
            >
              Sign out
            </button>
          </div>
        </header>

        {dataError && (
          <div role="alert" className="rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
            {dataError}
          </div>
        )}

        {data && (
          <>
            {/* Top Summary Cards */}
            <section aria-label="Key aggregate metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-5">
                <p className="text-xs font-black uppercase text-slate-400">Activity Starts</p>
                <p className="text-2xl sm:text-3xl font-black text-brand-ink mt-1 tabular-nums">
                  {data.totals.activityStarts.toLocaleString()}
                </p>
                <p className="text-xs font-bold text-slate-500 mt-1">Games, practice, drawing &amp; coloring</p>
              </div>

              <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-5">
                <p className="text-xs font-black uppercase text-slate-400">Completions</p>
                <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 tabular-nums">
                  {data.totals.activityCompletions.toLocaleString()}
                </p>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  Rate: {formatPct(data.rates.overall.completionRatePct)} of starts
                </p>
              </div>

              <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-5">
                <p className="text-xs font-black uppercase text-slate-400">Worksheet Downloads &amp; Prints</p>
                <p className="text-2xl sm:text-3xl font-black text-brand-blue mt-1 tabular-nums">
                  {(data.totals.worksheetDownloads + data.totals.worksheetPrints).toLocaleString()}
                </p>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  {data.totals.worksheetDownloads} downloads · {data.totals.worksheetPrints} prints
                </p>
              </div>

              <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-5">
                <p className="text-xs font-black uppercase text-slate-400">Section Views</p>
                <p className="text-2xl sm:text-3xl font-black text-brand-ink mt-1 tabular-nums">
                  {data.totals.sectionViews.toLocaleString()}
                </p>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  {data.totals.drawingSaves} saves · {data.totals.drawingExports} exports
                </p>
              </div>
            </section>

            {/* Activity Trends */}
            <section className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-brand-ink capitalize">
                    {range} Activity Trends
                  </h2>
                  <p className="text-xs font-bold text-slate-500">
                    UTC counter buckets ({data.windowDays[0]} to {data.windowDays[data.windowDays.length - 1]})
                  </p>
                </div>
              </div>
              <TrendChart buckets={trendSeries} range={range} />
            </section>

            {/* Games & Completion/Abandonment */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-6">
                <h2 className="text-lg font-black text-brand-ink mb-3">Most Played Games</h2>
                {data.mostPlayedGames.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-500">No game activity yet in this window.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 uppercase text-[11px]">
                          <th className="py-2 pr-3">Game</th>
                          <th className="py-2 px-2 text-right">Starts</th>
                          <th className="py-2 px-2 text-right">Done</th>
                          <th className="py-2 px-2 text-right">Exits</th>
                          <th className="py-2 pl-2 text-right">Comp.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-bold">
                        {data.mostPlayedGames.map((g) => (
                          <tr key={g.id}>
                            <td className="py-2.5 pr-3 text-brand-ink">{formatSlug(g.id)}</td>
                            <td className="py-2.5 px-2 text-right tabular-nums">{g.starts}</td>
                            <td className="py-2.5 px-2 text-right tabular-nums">{g.completions}</td>
                            <td className="py-2.5 px-2 text-right tabular-nums">{g.exits}</td>
                            <td className="py-2.5 pl-2 text-right text-emerald-600 tabular-nums">
                              {formatPct(g.completionRatePct)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-6">
                <h2 className="text-lg font-black text-brand-ink mb-1">
                  Completion &amp; Abandonment Rates
                </h2>
                <p className="text-xs font-bold text-slate-500 mb-4">
                  Estimated from anonymous aggregate totals (completions ÷ starts) without tracking sessions or users.
                </p>
                <div className="space-y-3">
                  {[
                    ['Games (Exits vs Starts)', data.rates.games],
                    ['Olympiad Practice', data.rates.practice],
                    ['Deity Coloring', data.rates.coloring],
                    ['Drawing & Tracing', data.rates.drawingAndTracing],
                  ].map(([label, metric]) => {
                    const m = metric as RateMetric;
                    return (
                      <div key={String(label)} className="rounded-2xl bg-slate-50 p-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-brand-ink">{String(label)}</p>
                          <p className="text-xs font-bold text-slate-500">
                            {m.completions} completed / {m.starts} started
                            {typeof m.exits === 'number' ? ` · ${m.exits} exited` : ''}
                          </p>
                        </div>
                        <div className="text-right tabular-nums">
                          <span className="block text-sm font-black text-emerald-600">
                            {formatPct(m.completionRatePct)} done
                          </span>
                          <span className="block text-xs font-bold text-slate-500">
                            {formatPct(m.abandonmentRatePct)} drop-off
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Drawing Tools, Subjects & Coloring Templates */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-6">
                <h2 className="text-lg font-black text-brand-ink mb-3">Popular Drawing Tools</h2>
                <HorizontalBarList
                  items={data.popularDrawingTools}
                  emptyLabel="No brush selections recorded yet."
                  barColor="bg-purple-500"
                />
              </div>

              <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-6">
                <h2 className="text-lg font-black text-brand-ink mb-3">Popular Learning Subjects</h2>
                {data.popularSubjects.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-500 py-3">No subject practice recorded yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.popularSubjects.map((sub) => (
                      <li key={sub.id} className="rounded-2xl bg-slate-50 p-3">
                        <div className="flex items-center justify-between text-sm font-black text-brand-ink">
                          <span>{formatSlug(sub.id)}</span>
                          <span className="tabular-nums">{sub.starts} starts</span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 mt-0.5">
                          {sub.views} views · {sub.completions} completed ({formatPct(sub.completionRatePct)})
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-6">
                <h2 className="text-lg font-black text-brand-ink mb-3">Popular Coloring Templates</h2>
                <HorizontalBarList
                  items={data.popularColoringTemplates}
                  emptyLabel="No coloring template counts recorded yet."
                  barColor="bg-amber-500"
                />
              </div>
            </section>

            {/* Worksheets & Section Popularity */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-6">
                <h2 className="text-lg font-black text-brand-ink mb-3">Product Section Popularity</h2>
                <HorizontalBarList
                  items={data.sectionPopularity}
                  emptyLabel="No section views recorded yet."
                  barColor="bg-brand-blue"
                />
              </div>

              <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-6 space-y-5">
                <div>
                  <h2 className="text-lg font-black text-brand-ink mb-2">Worksheet Downloads &amp; Prints</h2>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <span className="text-xs font-bold text-slate-500 block">Downloads</span>
                      <span className="text-xl font-black text-brand-ink tabular-nums">
                        {data.totals.worksheetDownloads}
                      </span>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <span className="text-xs font-bold text-slate-500 block">Printed / Packs</span>
                      <span className="text-xl font-black text-brand-ink tabular-nums">
                        {data.totals.worksheetPrints}
                      </span>
                    </div>
                  </div>
                  <HorizontalBarList
                    items={[
                      ...data.worksheetFormats.map((f) => ({ id: `download_${f.id}`, count: f.count })),
                      ...data.worksheetCategories.map((c) => ({ id: `print_${c.id}`, count: c.count })),
                    ]}
                    emptyLabel="No worksheet downloads or prints recorded yet."
                    barColor="bg-emerald-500"
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

