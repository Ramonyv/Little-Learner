import crypto from 'node:crypto';

const EPHEMERAL_SALT = crypto.randomBytes(32).toString('hex');
export const SESSION_COOKIE_NAME = 'jugnu_insights_session';
const DEFAULT_SESSION_TTL_SEC = 60 * 60 * 12; // 12 hours

const ALLOWED_ORIGINS = new Set([
  'https://jugnu.fun',
  'https://www.jugnu.fun',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:8888',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:4174',
  'http://127.0.0.1:8888',
]);

export function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
      ...extraHeaders,
    },
  });
}

export function isAllowedOrigin(request, env = process.env) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  if (!origin) {
    // Allow direct same-origin navigation/tests without Origin header only in dev/same-host requests,
    // or verify Referer when present.
    const referer = request.headers.get('referer');
    if (!referer) return false;
    try {
      const refOrigin = new URL(referer).origin;
      return isOriginPermitted(refOrigin, host, env);
    } catch {
      return false;
    }
  }
  return isOriginPermitted(origin, host, env);
}

function isOriginPermitted(origin, host, env) {
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (env.URL && origin === env.URL) return true;
  if (env.DEPLOY_PRIME_URL && origin === env.DEPLOY_PRIME_URL) return true;
  if (host) {
    try {
      const parsed = new URL(origin);
      if (parsed.host === host) return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * In-memory rate limiter using a transient cold-start-salted SHA-256 hash.
 * Client IPs are never stored durably or written to logs.
 */
export function createRateLimiter({ windowMs, maxRequests }) {
  const buckets = new Map();

  return function checkLimit(request, now = Date.now()) {
    const rawAddr =
      request.headers.get('x-nf-client-connection-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'local';
    const key = crypto
      .createHash('sha256')
      .update(`${EPHEMERAL_SALT}:${rawAddr}`)
      .digest('hex')
      .slice(0, 24);

    const existing = buckets.get(key);
    if (!existing || now - existing.start >= windowMs) {
      buckets.set(key, { start: now, count: 1 });
      if (buckets.size > 1000) {
        for (const [k, v] of buckets.entries()) {
          if (now - v.start >= windowMs) buckets.delete(k);
        }
      }
      return { allowed: true, remaining: maxRequests - 1 };
    }

    existing.count += 1;
    if (existing.count > maxRequests) {
      return { allowed: false, remaining: 0 };
    }
    return { allowed: true, remaining: maxRequests - existing.count };
  };
}

function getSigningSecret(env = process.env) {
  const secret = env.JUGNU_INSIGHTS_SECRET;
  if (typeof secret === 'string' && secret.trim().length >= 16) {
    return secret.trim();
  }
  if (env.NODE_ENV !== 'production' && env.CONTEXT !== 'production') {
    return 'jugnu-local-dev-only-insights-secret';
  }
  return null;
}

export function verifyOwnerPassword(candidate, env = process.env) {
  if (typeof candidate !== 'string' || candidate.length === 0 || candidate.length > 256) {
    return false;
  }

  const scryptHash = env.JUGNU_INSIGHTS_PASSWORD_HASH;
  if (typeof scryptHash === 'string' && scryptHash.startsWith('scrypt:')) {
    const parts = scryptHash.split(':');
    if (parts.length !== 3) return false;
    const [, saltHex, hashHex] = parts;
    try {
      const expected = Buffer.from(hashHex, 'hex');
      const derived = crypto.scryptSync(candidate, saltHex, expected.length);
      return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
    } catch {
      return false;
    }
  }

  const configuredPassword =
    env.JUGNU_INSIGHTS_PASSWORD ||
    (env.NODE_ENV !== 'production' && env.CONTEXT !== 'production'
      ? env.JUGNU_INSIGHTS_DEV_PASSWORD || ''
      : '');

  if (!configuredPassword) return false;

  const expectedDigest = crypto.createHash('sha256').update(configuredPassword).digest();
  const actualDigest = crypto.createHash('sha256').update(candidate).digest();
  return crypto.timingSafeEqual(expectedDigest, actualDigest);
}

export function createSessionCookie(request, env = process.env, ttlSec = DEFAULT_SESSION_TTL_SEC) {
  const secret = getSigningSecret(env);
  if (!secret) return null;

  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const nonce = crypto.randomBytes(12).toString('hex');
  const payload = Buffer.from(JSON.stringify({ v: 1, exp, nonce })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  const token = `${payload}.${sig}`;

  const isHttps =
    request.headers.get('x-forwarded-proto') === 'https' ||
    request.url?.startsWith('https://');
  const secureFlag = isHttps ? '; Secure' : '';

  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${ttlSec}${secureFlag}`;
}

export function clearSessionCookie(request) {
  const isHttps =
    request.headers.get('x-forwarded-proto') === 'https' ||
    request.url?.startsWith('https://');
  const secureFlag = isHttps ? '; Secure' : '';
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0${secureFlag}`;
}

export function parseCookie(headerValue, name) {
  if (!headerValue) return null;
  for (const part of headerValue.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    if (k === name) return part.slice(idx + 1).trim();
  }
  return null;
}

export function verifySessionCookie(request, env = process.env) {
  const secret = getSigningSecret(env);
  if (!secret) return false;

  const cookieHeader = request.headers.get('cookie');
  const token = parseCookie(cookieHeader, SESSION_COOKIE_NAME);
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;

  try {
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return false;
    }
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded || decoded.v !== 1 || typeof decoded.exp !== 'number') {
      return false;
    }
    return decoded.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

