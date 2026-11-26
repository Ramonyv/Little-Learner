import { jsonResponse, verifySessionCookie } from './_lib/security.mjs';
import {
  buildInsightsSummary,
  cleanEnv,
  createAggregateStore,
  getRecentUtcDateKeys,
} from './_lib/storage.mjs';

const VALID_RANGES = new Set(['daily', 'weekly', 'monthly']);

export function createInsightsDataHandler(options = {}) {
  const env = options.env ?? process.env;
  const storeOverride = options.store;

  return async function handleInsightsData(request) {
    if (request.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    if (!verifySessionCookie(request, env)) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const url = new URL(request.url, 'https://www.jugnu.fun');
    const requestedRange = url.searchParams.get('range') || 'weekly';
    const range = VALID_RANGES.has(requestedRange) ? requestedRange : 'weekly';

    const store = storeOverride ?? createAggregateStore(env);
    if (!store) {
      return jsonResponse({ error: 'Aggregate store not configured' }, 503);
    }

    try {
      // Read 90 days to support daily (1d), weekly (7d / 12wk), and monthly (30d / 3mo) trend rollups.
      const dateKeys = getRecentUtcDateKeys(90);
      const byDay = await store.readDays(dateKeys);
      const summary = buildInsightsSummary(byDay, range);
      return jsonResponse({
        ...summary,
        storageBackend: store.kind,
        collectionEnabled: cleanEnv(env.JUGNU_AGGREGATE_COLLECTION_ENABLED) === 'true',
      });
    } catch (err) {
      console.error('Insights data load failed:', err);
      return jsonResponse({ error: 'Could not load aggregate summary', details: err?.message }, 503);
    }
  };
}

const defaultHandler = createInsightsDataHandler();

export default async function handler(request) {
  return defaultHandler(request);
}

