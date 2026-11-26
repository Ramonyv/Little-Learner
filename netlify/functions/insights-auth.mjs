import {
  clearSessionCookie,
  createRateLimiter,
  createSessionCookie,
  isAllowedOrigin,
  jsonResponse,
  verifyOwnerPassword,
  verifySessionCookie,
} from './_lib/security.mjs';

const loginLimiter = createRateLimiter({ windowMs: 15 * 60_000, maxRequests: 10 });

export function createInsightsAuthHandler(options = {}) {
  const env = options.env ?? process.env;
  const limiter = options.limiter ?? loginLimiter;

  return async function handleAuth(request) {
    if (request.method === 'GET') {
      const authenticated = verifySessionCookie(request, env);
      return jsonResponse({ authenticated }, authenticated ? 200 : 401);
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    if (!isAllowedOrigin(request, env)) {
      return jsonResponse({ error: 'Origin not allowed' }, 403);
    }

    let body;
    try {
      const text = await request.text();
      if (Buffer.byteLength(text, 'utf8') > 1024) {
        return jsonResponse({ error: 'Payload too large' }, 413);
      }
      body = JSON.parse(text || '{}');
    } catch {
      return jsonResponse({ error: 'Malformed JSON' }, 400);
    }

    if (body?.action === 'logout') {
      return jsonResponse(
        { authenticated: false },
        200,
        { 'Set-Cookie': clearSessionCookie(request) },
      );
    }

    const rate = limiter(request);
    if (!rate.allowed) {
      return jsonResponse({ error: 'Too many login attempts. Wait 15 minutes.' }, 429, {
        'Retry-After': '900',
      });
    }

    const password = typeof body?.password === 'string' ? body.password : '';
    if (!verifyOwnerPassword(password, env)) {
      return jsonResponse({ authenticated: false, error: 'Invalid credentials' }, 401);
    }

    const cookie = createSessionCookie(request, env);
    if (!cookie) {
      return jsonResponse({ error: 'Auth secret not configured' }, 503);
    }

    return jsonResponse(
      { authenticated: true },
      200,
      { 'Set-Cookie': cookie },
    );
  };
}

const defaultHandler = createInsightsAuthHandler();

export default async function handler(request) {
  return defaultHandler(request);
}

