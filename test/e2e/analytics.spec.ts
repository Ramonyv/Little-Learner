import { expect, test } from '@playwright/test';

type MockEvent = {
  name: string;
  params: Record<string, string | number | boolean>;
  timestamp: number;
  droppedKeys?: string[];
};

async function readMockEvents(page: import('@playwright/test').Page): Promise<MockEvent[]> {
  return page.evaluate(() => window.__JUGNU_ANALYTICS__?.getMockEvents() ?? []);
}

test.describe('Privacy-first analytics instrumentation', () => {
  test('never loads GA4 scripts or fires Google network requests by default', async ({ page }) => {
    const externalAnalyticsRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('googletagmanager.com') || url.includes('google-analytics.com')) {
        externalAnalyticsRequests.push(url);
      }
    });

    await page.goto('/');
    await page.goto('/games/sliding-puzzle');
    await page.goto('/drawing-board');
    await page.goto('/topics/english');

    const gaScriptCount = await page.locator('script[src*="googletagmanager"]').count();
    const hasGtag = await page.evaluate(() => typeof (window as { gtag?: unknown }).gtag === 'function');
    const config = await page.evaluate(() => window.__JUGNU_ANALYTICS__?.getConfig());

    expect(externalAnalyticsRequests).toEqual([]);
    expect(gaScriptCount).toBe(0);
    expect(hasGtag).toBe(false);
    expect(config?.enabled).toBe(false);
    expect(config?.ga4Enabled).toBe(false);
    expect(config?.childPrivacyApproved).toBe(false);
  });

  test('enforces PII sanitization, query stripping, deduplication, and fault isolation', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.__JUGNU_ANALYTICS__?.clearMockEvents());

    // Custom worksheet query parameter must never appear in analytics events.
    await page.goto('/drawing-board?mode=Worksheet&custom=SecretChildName123');
    let events = await readMockEvents(page);
    expect(JSON.stringify(events)).not.toContain('SecretChildName123');

    // Printable custom words must never leak to worksheet_printed.
    await page.goto('/learning-tools');
    await page.locator('textarea').fill('Aarav, Priya, Moon');
    await page.getByRole('button', { name: 'Create printable pack' }).click();
    events = await readMockEvents(page);
    expect(JSON.stringify(events)).not.toContain('Aarav');
    expect(events.some((e) => e.name === 'worksheet_printed' && e.params.template_category === 'custom_worksheet')).toBe(true);

    // Direct API test: drops disallowed keys, rejects PII-shaped slugs, deduplicates repeats, and isolates throwing transports.
    const apiResult = await page.evaluate(() => {
      const svc = window.__JUGNU_ANALYTICS__;
      if (!svc) return null;
      svc.clearMockEvents();

      svc.addTransport({
        name: 'broken-transport',
        send() {
          throw new Error('Simulated analytics network failure');
        },
      });
      svc.configure({ enabled: true, ga4Enabled: false, debug: true });

      const firstOk = svc.track('template_selected', {
        template_category: 'letters',
        template_id: 'kid@example.com',
        extra_secret: 'should-be-dropped',
      } as never);

      const secondOk = svc.track('game_started', { game_id: 'sliding_puzzle', difficulty: '3x3' });
      const deduped = svc.track('game_started', { game_id: 'sliding_puzzle', difficulty: '3x3' });

      const recorded = svc.getMockEvents();
      svc.configure({ enabled: false, ga4Enabled: false, debug: true });
      return { firstOk, secondOk, deduped, recorded };
    });

    expect(apiResult).not.toBeNull();
    expect(apiResult!.firstOk).toBe(true);
    expect(apiResult!.secondOk).toBe(true);
    expect(apiResult!.deduped).toBe(false);
    expect(apiResult!.recorded[0].params.template_id).toBeUndefined();
    expect(apiResult!.recorded[0].params.extra_secret).toBeUndefined();
    expect(apiResult!.recorded[1].name).toBe('game_started');
  });

  test('tracks education, achievements, and drawing flows on Desktop (1280x800)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.evaluate(() => window.__JUGNU_ANALYTICS__?.clearMockEvents());

    // Subject selection & practice flow
    await page.getByLabel('Open English practice').click();
    await page.getByRole('button', { name: 'List view' }).click();
    await page.getByRole('link', { name: /Practice Papers|Paper 1/i }).first().click();
    await page.getByRole('button', { name: /Start Practice/i }).click();

    // Verify practice_started fired cleanly without storing answers
    let events = await readMockEvents(page);
    expect(events.some((e) => e.name === 'subject_selected' && e.params.subject_id === 'english')).toBe(true);
    expect(events.some((e) => e.name === 'feature_used' && e.params.feature_id === 'view_mode_list')).toBe(true);
    expect(events.some((e) => e.name === 'practice_started' && e.params.subject_id === 'english')).toBe(true);

    // Drawing board flow on Desktop
    await page.goto('/drawing-board');
    await page.getByRole('button', { name: 'Pencil', exact: true }).click();
    await page.getByRole('button', { name: 'Chalkboard' }).click();
    const canvasBox = await page.locator('.db2-paper canvas').first().boundingBox();
    expect(canvasBox).not.toBeNull();
    await page.mouse.move(canvasBox!.x + 80, canvasBox!.y + 80);
    await page.mouse.down();
    await page.mouse.move(canvasBox!.x + 180, canvasBox!.y + 120);
    await page.mouse.up();

    await page.getByRole('button', { name: /✓ Save/i }).click();
    await page.getByRole('button', { name: 'Free Draw' }).click();

    events = await readMockEvents(page);
    expect(events.some((e) => e.name === 'section_viewed' && e.params.section_id === 'drawing_board')).toBe(true);
    expect(events.some((e) => e.name === 'brush_selected' && e.params.brush_id === 'pencil')).toBe(true);
    expect(events.some((e) => e.name === 'theme_changed' && e.params.theme_id === 'chalkboard')).toBe(true);
    expect(events.some((e) => e.name === 'drawing_started' && e.params.board_mode === 'trace')).toBe(true);
    expect(events.some((e) => e.name === 'tracing_completed')).toBe(true);
    expect(events.some((e) => e.name === 'drawing_saved' && e.params.board_mode === 'trace')).toBe(true);
    expect(events.some((e) => e.name === 'activity_selected' && e.params.activity_id === 'free_draw')).toBe(true);
  });

  test('tracks game flows accurately on Tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/games/sliding-puzzle');
    await page.evaluate(() => window.__JUGNU_ANALYTICS__?.clearMockEvents());

    // On <=900px viewports Difficulty is rendered in .p-mobile-select
    await page.getByLabel(/Difficulty:/i).selectOption('4');
    await page.getByRole('button', { name: /Shuffle/i }).click();
    await page.locator('.puzzle-board button:not([disabled])').first().click();
    await page.getByRole('button', { name: /Hint/i }).click();
    await page.getByRole('button', { name: /Reset/i }).click();

    let events = await readMockEvents(page);
    expect(events.some((e) => e.name === 'difficulty_selected' && e.params.difficulty === '4x4')).toBe(true);
    expect(events.some((e) => e.name === 'game_started' && e.params.game_id === 'sliding_puzzle')).toBe(true);
    expect(events.some((e) => e.name === 'feature_used' && e.params.feature_id === 'hint')).toBe(true);
    expect(events.some((e) => e.name === 'game_restarted' && e.params.game_id === 'sliding_puzzle')).toBe(true);

    // Move a tile again so puzzle is active when exiting back to Games
    await page.locator('.puzzle-board button:not([disabled])').first().click();
    await page.getByRole('link', { name: 'Back to Games' }).click();
    events = await readMockEvents(page);
    expect(events.some((e) => e.name === 'game_exited' && e.params.game_id === 'sliding_puzzle')).toBe(true);

    await page.getByRole('link', { name: 'Play Hanuman Runner' }).click();
    await page.getByRole('button', { name: '3D Style' }).click();
    await page.waitForSelector('button.run-primary:not([disabled])');
    await page.getByRole('button', { name: /Start running/i }).click();
    await page.getByRole('button', { name: 'Pause game' }).click();

    events = await readMockEvents(page);
    expect(events.some((e) => e.name === 'theme_changed' && e.params.theme_id === 'runner_3d')).toBe(true);
    expect(events.some((e) => e.name === 'game_started' && e.params.game_id === 'hanuman_runner')).toBe(true);
    expect(events.some((e) => e.name === 'feature_used' && e.params.feature_id === 'pause')).toBe(true);
  });

  test('tracks coloring, seed tracing, and navigation on Mobile (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/drawing-board?mode=Gods');
    await page.evaluate(() => window.__JUGNU_ANALYTICS__?.clearMockEvents());

    // Wait for Ganesha canvas outline to load, switch to Marker brush, and draw a stroke
    const godsCanvasLocator = page.locator('canvas[aria-label="Ganesha colouring page"]');
    await godsCanvasLocator.waitFor();
    await page.getByRole('button', { name: 'Marker', exact: true }).click();
    await godsCanvasLocator.scrollIntoViewIfNeeded();
    const godsCanvas = await godsCanvasLocator.boundingBox();
    expect(godsCanvas).not.toBeNull();
    await page.mouse.move(godsCanvas!.x + godsCanvas!.width * 0.45, godsCanvas!.y + godsCanvas!.height * 0.45);
    await page.mouse.down();
    await page.mouse.move(godsCanvas!.x + godsCanvas!.width * 0.55, godsCanvas!.y + godsCanvas!.height * 0.55);
    await page.mouse.up();

    let events = await readMockEvents(page);
    expect(events.some((e) => e.name === 'brush_selected' && e.params.brush_id === 'marker')).toBe(true);
    expect(events.some((e) => e.name === 'coloring_started' && e.params.board_mode === 'gods')).toBe(true);

    // Seed explore activity on mobile
    await page.goto('/explore/seed');
    const seedCanvas = await page.locator('.aspect-\\[5\\/3\\] canvas').boundingBox();
    expect(seedCanvas).not.toBeNull();
    await page.mouse.move(seedCanvas!.x + 40, seedCanvas!.y + 40);
    await page.mouse.down();
    await page.mouse.move(seedCanvas!.x + 120, seedCanvas!.y + 90);
    await page.mouse.up();

    events = await readMockEvents(page);
    expect(events.some((e) => e.name === 'section_viewed' && e.params.section_id === 'explore_seed')).toBe(true);
    expect(events.some((e) => e.name === 'tracing_completed' && e.params.template_id === 'seed_root')).toBe(true);
  });

  test('restricts GA4 strictly to parent marketing pages and batches first-party aggregate events without cookies', async ({ page }) => {
    await page.goto('/');
    const receivedBatches: Array<{ events: MockEvent[] }> = [];
    await page.route('**/.netlify/functions/analytics-collect', async (route) => {
      receivedBatches.push(route.request().postDataJSON());
      await route.fulfill({ status: 202, contentType: 'application/json', body: '{"ok":true}' });
    });

    const ga4GateResults = await page.evaluate(async () => {
      const svc = window.__JUGNU_ANALYTICS__;
      if (!svc) return null;
      svc.clearMockEvents();
      svc.configure({
        enabled: true,
        aggregateEnabled: true,
        ga4Enabled: false,
        childPrivacyApproved: false,
        debug: true,
      });

      // Trigger mixed marketing and child-facing events through AggregateTransport
      svc.track('section_viewed', { section_id: 'home' });
      svc.track('game_started', { game_id: 'sliding_puzzle', difficulty: '3x3' });
      svc.track('brush_selected', { brush_id: 'pencil', board_mode: 'trace' });
      svc.track('practice_started', { subject_id: 'english', topic_id: 'vocabulary', practice_mode: 'practice' });
      svc.track('worksheet_downloaded', { export_format: 'pdf', template_category: 'letters' });

      // Wait for batch flush (5 events triggers immediate flush)
      await new Promise((r) => setTimeout(r, 100));
      svc.configure({ enabled: false, aggregateEnabled: false, ga4Enabled: false, childPrivacyApproved: false, debug: true });

      const mod = await import('/src/analytics/ga4Transport.ts');
      return {
        homeAllowed: mod.isEventAllowedForGa4('section_viewed', { section_id: 'home' }, 'home'),
        aboutAllowed: mod.isEventAllowedForGa4('section_viewed', { section_id: 'about' }, 'about'),
        gameBlocked: mod.isEventAllowedForGa4('game_started', { game_id: 'sliding_puzzle' }, 'sliding_puzzle'),
        puzzleViewBlocked: mod.isEventAllowedForGa4('section_viewed', { section_id: 'sliding_puzzle' }, 'sliding_puzzle'),
        boardBlocked: mod.isEventAllowedForGa4('brush_selected', { brush_id: 'pencil', board_mode: 'trace' }, 'drawing_board'),
        examBlocked: mod.isEventAllowedForGa4('practice_started', { subject_id: 'english' }, 'exam_session'),
      };
    });

    expect(ga4GateResults).toEqual({
      homeAllowed: true,
      aboutAllowed: true,
      gameBlocked: false,
      puzzleViewBlocked: false,
      boardBlocked: false,
      examBlocked: false,
    });
    expect(receivedBatches.length).toBeGreaterThanOrEqual(1);
    const flat = receivedBatches.flatMap((b) => b.events);
    expect(flat.some((e) => e.name === 'game_started' && e.params.game_id === 'sliding_puzzle')).toBe(true);
    expect(flat.some((e) => e.name === 'worksheet_downloaded' && e.params.export_format === 'pdf')).toBe(true);
  });

  test('renders private authenticated Jugnu Insights dashboard across desktop, tablet and mobile', async ({ page }) => {
    let authed = false;
    const sampleSummary = {
      range: 'weekly',
      windowDays: ['2026-11-20', '2026-11-26'],
      privacyMode: 'aggregate_only_no_pii',
      storageBackend: 'upstash-redis',
      collectionEnabled: false,
      totals: {
        activityStarts: 142,
        activityCompletions: 98,
        sectionViews: 420,
        worksheetDownloads: 27,
        worksheetPrints: 19,
        drawingSaves: 31,
        drawingExports: 14,
      },
      rates: {
        overall: { starts: 142, completions: 98, completionRatePct: 69, abandonmentRatePct: 31 },
        games: { starts: 60, completions: 42, exits: 12, completionRatePct: 70, abandonmentRatePct: 20 },
        practice: { starts: 40, completions: 31, completionRatePct: 78, abandonmentRatePct: 22 },
        coloring: { starts: 22, completions: 15, completionRatePct: 68, abandonmentRatePct: 32 },
        drawingAndTracing: { starts: 20, completions: 18, completionRatePct: 90, abandonmentRatePct: 10 },
      },
      mostPlayedGames: [
        { id: 'sliding_puzzle', starts: 38, completions: 30, exits: 5, completionRatePct: 79, abandonmentRatePct: 13 },
        { id: 'hanuman_runner', starts: 22, completions: 12, exits: 7, completionRatePct: 55, abandonmentRatePct: 32 },
      ],
      popularDrawingTools: [
        { id: 'fountain_pen', count: 55 },
        { id: 'fill', count: 41 },
        { id: 'pencil', count: 29 },
      ],
      popularBoardModes: [{ id: 'trace', count: 52 }],
      popularSubjects: [
        { id: 'english', views: 90, starts: 25, completions: 20, completionRatePct: 80, abandonmentRatePct: 20 },
        { id: 'mathematics', views: 54, starts: 15, completions: 11, completionRatePct: 73, abandonmentRatePct: 27 },
      ],
      popularColoringTemplates: [
        { id: 'deity_ganesha', count: 18 },
        { id: 'deity_krishna', count: 12 },
      ],
      popularTemplates: [],
      worksheetFormats: [{ id: 'pdf', count: 27 }],
      worksheetCategories: [{ id: 'custom_worksheet', count: 19 }],
      sectionPopularity: [
        { id: 'home', count: 180 },
        { id: 'drawing_board', count: 110 },
        { id: 'games', count: 80 },
      ],
      popularFeatures: [{ id: 'hint', count: 24 }],
      trends: {
        daily: [{ label: '2026-11-26', starts: 34, completions: 24, views: 90 }],
        weekly: [{ label: '2026-11-20..11-26', starts: 142, completions: 98, views: 420 }],
        monthly: [{ label: '2026-11', starts: 142, completions: 98, views: 420 }],
      },
    };

    await page.route('**/.netlify/functions/insights-auth', async (route) => {
      const req = route.request();
      if (req.method() === 'GET') {
        await route.fulfill({
          status: authed ? 200 : 401,
          contentType: 'application/json',
          body: JSON.stringify({ authenticated: authed }),
        });
        return;
      }
      const body = req.postDataJSON();
      if (body?.action === 'logout') {
        authed = false;
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"authenticated":false}' });
        return;
      }
      if (body?.password === 'owner-test-secret') {
        authed = true;
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"authenticated":true}' });
      } else {
        await route.fulfill({ status: 401, contentType: 'application/json', body: '{"authenticated":false,"error":"Invalid credentials"}' });
      }
    });

    await page.route('**/.netlify/functions/insights-data**', async (route) => {
      if (!authed) {
        await route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"Unauthorized"}' });
        return;
      }
      const rangeParam = new URL(route.request().url()).searchParams.get('range') || 'weekly';
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...sampleSummary, range: rangeParam }),
      });
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/insights');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
    await expect(page.getByRole('heading', { name: 'Jugnu Insights' })).toBeVisible();

    // Unauthenticated wrong passphrase fails gracefully
    await page.getByLabel(/Owner passphrase/i).fill('wrong-pass');
    await page.getByRole('button', { name: 'Open Jugnu Insights' }).click();
    await expect(page.getByRole('alert')).toContainText('Invalid credentials');

    // Valid passphrase opens dashboard metrics & trend switches
    await page.getByLabel(/Owner passphrase/i).fill('owner-test-secret');
    await page.getByRole('button', { name: 'Open Jugnu Insights' }).click();
    await expect(page.getByText('142').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Most Played Games' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Popular Drawing Tools' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Popular Learning Subjects' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Popular Coloring Templates' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Worksheet Downloads & Prints' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Completion & Abandonment Rates' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Product Section Popularity' })).toBeVisible();

    await page.getByRole('button', { name: 'monthly' }).click();
    await expect(page.getByRole('heading', { name: /monthly Activity Trends/i })).toBeVisible();
    await page.getByRole('button', { name: 'daily' }).click();
    await expect(page.getByRole('heading', { name: /daily Activity Trends/i })).toBeVisible();

    // Verify clean responsive layout on Tablet and Mobile without horizontal overflow
    for (const vp of [{ width: 768, height: 1024 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(vp);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      expect(overflow).toBe(false);
    }

    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('button', { name: 'Open Jugnu Insights' })).toBeVisible();
  });
});

