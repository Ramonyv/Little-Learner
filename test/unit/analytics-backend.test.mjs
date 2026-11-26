import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  ANALYTICS_EVENT_NAMES,
  EVENT_PARAM_ALLOWLIST,
  validateBatchPayload,
} from '../../netlify/functions/_lib/aggregateContract.mjs';
import { createRateLimiter } from '../../netlify/functions/_lib/security.mjs';
import { createAggregateStore, toUtcDateKey } from '../../netlify/functions/_lib/storage.mjs';
import { createCollectHandler } from '../../netlify/functions/analytics-collect.mjs';
import { createInsightsAuthHandler } from '../../netlify/functions/insights-auth.mjs';
import { createInsightsDataHandler } from '../../netlify/functions/insights-data.mjs';

function makeJsonRequest(url, { method = 'POST', body, origin = 'https://www.jugnu.fun', cookie } = {}) {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (origin) headers.set('origin', origin);
  if (cookie) headers.set('cookie', cookie);
  return new Request(url, {
    method,
    headers,
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  });
}

test('server aggregate contract stays synchronized with client events.ts allowlist', () => {
  const eventsTs = fs.readFileSync(
    path.resolve('src/analytics/events.ts'),
    'utf8',
  );
  for (const name of ANALYTICS_EVENT_NAMES) {
    assert.ok(eventsTs.includes(`'${name}'`), `Missing event ${name} in src/analytics/events.ts`);
  }
  assert.equal(ANALYTICS_EVENT_NAMES.length, 26);
  assert.equal(Object.keys(EVENT_PARAM_ALLOWLIST).length, 26);
});

test('collector stays disabled by default and rejects PII / bad origins / rate bursts when active', async () => {
  const store = createAggregateStore({ NODE_ENV: 'test' }, new Map());
  const disabledHandler = createCollectHandler({ env: {}, store });
  const disabledRes = await disabledHandler(
    makeJsonRequest('https://www.jugnu.fun/.netlify/functions/analytics-collect', {
      body: { events: [{ name: 'game_started', params: { game_id: 'sliding_puzzle' } }] },
    }),
  );
  assert.equal(disabledRes.status, 204);

  const activeEnv = {
    NODE_ENV: 'test',
    JUGNU_AGGREGATE_COLLECTION_ENABLED: 'true',
  };
  const activeHandler = createCollectHandler({
    env: activeEnv,
    store,
    limiter: createRateLimiter({ windowMs: 60_000, maxRequests: 3 }),
  });

  // Cross-origin blocked
  const badOrigin = await activeHandler(
    makeJsonRequest('https://www.jugnu.fun/.netlify/functions/analytics-collect', {
      origin: 'https://evil.example.com',
      body: { events: [{ name: 'game_started', params: { game_id: 'sliding_puzzle' } }] },
    }),
  );
  assert.equal(badOrigin.status, 403);

  // PII rejected
  const piiRejected = await activeHandler(
    makeJsonRequest('https://www.jugnu.fun/.netlify/functions/analytics-collect', {
      body: { events: [{ name: 'template_selected', params: { template_category: 'letters', template_id: 'kid@email.com' } }] },
    }),
  );
  assert.equal(piiRejected.status, 400);

  // Batch size > 10 rejected
  const hugeBatch = validateBatchPayload({
    events: Array.from({ length: 11 }, () => ({ name: 'section_viewed', params: { section_id: 'home' } })),
  });
  assert.equal(hugeBatch.ok, false);

  // Valid aggregate batch accepted
  const ok1 = await activeHandler(
    makeJsonRequest('https://www.jugnu.fun/.netlify/functions/analytics-collect', {
      body: {
        events: [
          { name: 'game_started', params: { game_id: 'sliding_puzzle', difficulty: '3x3' } },
          { name: 'game_completed', params: { game_id: 'sliding_puzzle', difficulty: '3x3' } },
          { name: 'brush_selected', params: { brush_id: 'pencil', board_mode: 'trace' } },
          { name: 'worksheet_downloaded', params: { export_format: 'pdf', template_category: 'letters' } },
        ],
      },
    }),
  );
  assert.equal(ok1.status, 202);

  // Exceeding rate limit triggers 429
  await activeHandler(
    makeJsonRequest('https://www.jugnu.fun/.netlify/functions/analytics-collect', {
      body: { events: [{ name: 'section_viewed', params: { section_id: 'home' } }] },
    }),
  );
  const limited = await activeHandler(
    makeJsonRequest('https://www.jugnu.fun/.netlify/functions/analytics-collect', {
      body: { events: [{ name: 'section_viewed', params: { section_id: 'home' } }] },
    }),
  );
  assert.equal(limited.status, 429);

  // Stored day hash contains only aggregate integer counters, zero PII
  const saved = await store.readDays([toUtcDateKey()]);
  const todayCounters = saved[toUtcDateKey()];
  assert.equal(todayCounters['ev|game_started'], 1);
  assert.equal(todayCounters['ev|section_viewed'], 1);
  assert.equal(todayCounters['dim|brush|pencil|brush_selected'], 1);
  assert.equal(todayCounters['dim|worksheet_fmt|pdf|worksheet_downloaded'], 1);
});

test('insights auth enforces scrypt/password + signed HttpOnly session and gates aggregate summary', async () => {
  const memMap = new Map();
  const store = createAggregateStore({ NODE_ENV: 'test' }, memMap);
  const salt = '0123456789abcdef0123456789abcdef';
  const pass = 'correct-horse-jugnu-2026';
  const derived = crypto.scryptSync(pass, salt, 32).toString('hex');

  const env = {
    NODE_ENV: 'production',
    CONTEXT: 'production',
    JUGNU_AGGREGATE_COLLECTION_ENABLED: 'true',
    JUGNU_INSIGHTS_SECRET: 'super-secret-signing-key-at-least-32-chars',
    JUGNU_INSIGHTS_PASSWORD_HASH: `scrypt:${salt}:${derived}`,
  };

  const collect = createCollectHandler({ env, store });
  const auth = createInsightsAuthHandler({ env });
  const data = createInsightsDataHandler({ env, store });

  // Seed some events across categories
  await collect(
    makeJsonRequest('https://www.jugnu.fun/.netlify/functions/analytics-collect', {
      body: {
        events: [
          { name: 'section_viewed', params: { section_id: 'home' } },
          { name: 'subject_selected', params: { subject_id: 'english', source_section: 'home' } },
          { name: 'practice_started', params: { subject_id: 'english', topic_id: 'vocabulary', practice_mode: 'practice' } },
          { name: 'practice_completed', params: { subject_id: 'english', topic_id: 'vocabulary', practice_mode: 'practice', score_band: '90_plus', duration_bucket: '30s_to_2m' } },
          { name: 'coloring_started', params: { board_mode: 'gods', template_category: 'gods', template_id: 'deity_ganesha', brush_id: 'fill' } },
          { name: 'coloring_completed', params: { board_mode: 'gods', template_category: 'gods', template_id: 'deity_ganesha' } },
        ],
      },
    }),
  );

  // Unauthenticated data access rejected with 401
  const unauthData = await data(
    new Request('https://www.jugnu.fun/.netlify/functions/insights-data?range=weekly', { method: 'GET' }),
  );
  assert.equal(unauthData.status, 401);

  // Wrong passphrase fails 401
  const badLogin = await auth(
    makeJsonRequest('https://www.jugnu.fun/.netlify/functions/insights-auth', {
      body: { action: 'login', password: 'wrong-password' },
    }),
  );
  assert.equal(badLogin.status, 401);

  // Valid passphrase returns HttpOnly SameSite=Strict cookie
  const goodLogin = await auth(
    makeJsonRequest('https://www.jugnu.fun/.netlify/functions/insights-auth', {
      body: { action: 'login', password: pass },
    }),
  );
  assert.equal(goodLogin.status, 200);
  const setCookie = goodLogin.headers.get('set-cookie');
  assert.ok(setCookie && setCookie.includes('HttpOnly') && setCookie.includes('SameSite=Strict'));

  const cookiePair = setCookie.split(';')[0];
  const authedData = await data(
    new Request('https://www.jugnu.fun/.netlify/functions/insights-data?range=monthly', {
      method: 'GET',
      headers: { cookie: cookiePair },
    }),
  );
  assert.equal(authedData.status, 200);
  const summary = await authedData.json();
  assert.equal(summary.privacyMode, 'aggregate_only_no_pii');
  assert.equal(summary.totals.activityStarts, 2);
  assert.equal(summary.totals.activityCompletions, 2);
  assert.equal(summary.rates.practice.completionRatePct, 100);
  assert.equal(summary.popularSubjects[0].id, 'english');
  assert.equal(summary.popularColoringTemplates[0].id, 'deity_ganesha');
  assert.equal(summary.sectionPopularity[0].id, 'home');
});
