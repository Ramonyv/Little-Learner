import {
  MAX_BODY_BYTES,
  extractCounterIncrements,
  validateBatchPayload,
} from './_lib/aggregateContract.mjs';
import { createRateLimiter, isAllowedOrigin, jsonResponse } from './_lib/security.mjs';
import { createAggregateStore, toUtcDateKey } from './_lib/storage.mjs';

const ingestLimiter = createRateLimiter({ windowMs: 60_000, maxRequests: 60 });

export function createCollectHandler(options = {}) {
  const env = options.env ?? process.env;
  const limiter = options.limiter ?? ingestLimiter;
  const storeOverride = options.store;

  return async function handleCollect(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // Production collection stays disabled unless explicitly activated by the owner.
    if (env.JUGNU_AGGREGATE_COLLECTION_ENABLED !== 'true') {
      return new Response(null, {
        status: 204,
        headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' },
      });
    }

    if (!isAllowedOrigin(request, env)) {
      return jsonResponse({ error: 'Origin not allowed' }, 403);
    }

    const rate = limiter(request);
    if (!rate.allowed) {
      return jsonResponse({ error: 'Rate limit exceeded' }, 429, { 'Retry-After': '60' });
    }

    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return jsonResponse({ error: 'Payload too large' }, 413);
    }

    let rawText = '';
    try {
      rawText = await request.text();
    } catch {
      return jsonResponse({ error: 'Invalid body' }, 400);
    }
    if (!rawText || Buffer.byteLength(rawText, 'utf8') > MAX_BODY_BYTES) {
      return jsonResponse({ error: 'Payload out of bounds' }, 413);
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      return jsonResponse({ error: 'Malformed JSON' }, 400);
    }

    const validation = validateBatchPayload(parsed);
    if (!validation.ok) {
      return jsonResponse({ error: validation.error }, 400);
    }

    const store = storeOverride ?? createAggregateStore(env);
    if (!store) {
      return jsonResponse({ error: 'Aggregate store not configured' }, 503);
    }

    const combinedIncrements = {};
    for (const event of validation.events) {
      const inc = extractCounterIncrements(event);
      for (const [field, delta] of Object.entries(inc)) {
        combinedIncrements[field] = (combinedIncrements[field] || 0) + delta;
      }
    }

    try {
      await store.incrementDay(toUtcDateKey(), combinedIncrements);
    } catch {
      // Never leak backend error details or request bodies in response/logs.
      return jsonResponse({ error: 'Storage temporarily unavailable' }, 503);
    }

    return jsonResponse({ ok: true, accepted: validation.events.length }, 202);
  };
}

const defaultHandler = createCollectHandler();

export default async function handler(request) {
  return defaultHandler(request);
}

