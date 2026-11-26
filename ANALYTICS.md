# Jugnu — Hybrid Privacy-First Product Analytics

> **Status:** Hybrid aggregate-only architecture & private **Jugnu Insights** dashboard implemented and tested locally. **Production collection (`VITE_ANALYTICS_ENABLED`, `VITE_AGGREGATE_ANALYTICS_ENABLED`, `JUGNU_AGGREGATE_COLLECTION_ENABLED`) and GA4 (`G-JZV578ZF17`) remain DISABLED by default** until reviewed and explicitly approved for deployment.

---

## 1. Hybrid Architecture Overview

Jugnu separates child-facing product analytics from parent-facing site analytics:

| Layer | Child Activities (Games, Drawing, Coloring, Practice, Worksheets) | Parent Marketing Pages (`/`, `/about`, `/information/*`, `/contact`) |
| --- | --- | --- |
| **Collection Mechanism** | First-party `AggregateTransport` -> Netlify Function (`/.netlify/functions/analytics-collect`) | Optional lazy `Ga4Transport` (`G-JZV578ZF17`), blocked on all child routes |
| **Default Production State** | **Disabled** (`VITE_ANALYTICS_ENABLED=false`, `VITE_AGGREGATE_ANALYTICS_ENABLED=false`, `JUGNU_AGGREGATE_COLLECTION_ENABLED=false`) | **Disabled** (`VITE_GA4_ENABLED=false`, `VITE_ANALYTICS_CHILD_PRIVACY_APPROVED=false`) |
| **Cookies / Identifiers** | Zero cookies, zero `localStorage` client IDs, zero session IDs, zero IP logging | `client_storage: 'none'`, Consent Mode defaults `'denied'` |
| **Storage Shape** | Atomic UTC daily integer counter hashes (`jugnu:agg:v1:YYYY-MM-DD`) | N/A until approved |
| **Owner Visibility** | Private authenticated dashboard at `/insights` (**Jugnu Insights**) | Google Analytics (only if explicitly enabled post-review) |

### Client Modules (`src/analytics/`)
- [`src/analytics/config.ts`](src/analytics/config.ts): Triple-gated feature flags (`enabled`, `aggregateEnabled`, `ga4Enabled`, `childPrivacyApproved`) and `PARENT_MARKETING_SECTIONS` allowlist (`home`, `about`, `information`, `contact`).
- [`src/analytics/events.ts`](src/analytics/events.ts): Strict TypeScript schemas and `EVENT_PARAM_ALLOWLIST` for all 26 non-personal events, plus `sanitizeEventParams()` PII stripping.
- [`src/analytics/aggregateTransport.ts`](src/analytics/aggregateTransport.ts): Cookie-free micro-batching transport (`<= 5` events/batch, `sendBeacon` / `keepalive` fetch on unload).
- [`src/analytics/ga4Transport.ts`](src/analytics/ga4Transport.ts): Hard-gated GA4 adapter enforcing `isEventAllowedForGa4()` so child sections can never reach Google Analytics.
- [`src/analytics/service.ts`](src/analytics/service.ts): `AnalyticsService` singleton with `try/catch` isolation, `1500 ms` deduplication, console debug logs, and bounded dev-only mock buffer (`max 200`, never persisted).
- [`src/analytics/useSectionTracking.ts`](src/analytics/useSectionTracking.ts): Route tracker mapping `pathname` to canonical `section_id` values (strips queries/hashes, skips `/insights`).

### Serverless Backend & Owner Dashboard
- [`netlify.toml`](netlify.toml): Netlify build & `netlify/functions` ESM bundler configuration.
- [`netlify/functions/_lib/aggregateContract.mjs`](netlify/functions/_lib/aggregateContract.mjs): Server-side strict schema/PII validator (`MAX_EVENTS_PER_BATCH = 10`, `MAX_BODY_BYTES = 4096`) and flat counter key extractor.
- [`netlify/functions/_lib/security.mjs`](netlify.functions/_lib/security.mjs): Same-origin check, cold-start-salted transient rate limiting (no IPs logged/persisted), `scrypt` password verification, and HMAC-SHA256 `HttpOnly; SameSite=Strict` session cookies.
- [`netlify/functions/_lib/storage.mjs`](netlify.functions/_lib/storage.mjs): Upstash Redis REST pipeline client (`HINCRBY` / `HGETALL` with 400-day aggregate TTL) + non-prod local memory store + rollup calculations for **Jugnu Insights**.
- [`netlify/functions/analytics-collect.mjs`](netlify/functions/analytics-collect.mjs): Aggregate ingestion endpoint (returns `204` while `JUGNU_AGGREGATE_COLLECTION_ENABLED !== 'true'`).
- [`netlify/functions/insights-auth.mjs`](netlify/functions/insights-auth.mjs) & [`netlify/functions/insights-data.mjs`](netlify/functions/insights-data.mjs): Owner auth + aggregate dashboard JSON API.
- [`src/pages/InsightsPage.tsx`](src/pages/InsightsPage.tsx): Lazy-loaded `/insights` dashboard (`noindex,nofollow`, omitted from header/footer/sitemap/llms).

---

## 2. Durable Storage Evaluation & Cost Estimate

We evaluated storage backends against Netlify's hosting model and atomic concurrency requirements:

| Option | Free-Tier Limits (Verified) | Atomicity & Fit | Ongoing Paid Scaling |
| --- | --- | --- | --- |
| **Upstash Redis REST** *(Chosen Primary)* | **$0/mo** — **500,000 commands/month**, 250 MB storage, 10 GB/mo bandwidth, zero extra npm deps (`fetch` to `/pipeline`) | **Native atomic `HINCRBY`** per UTC daily hash; concurrent kids never lose increments; single pipeline query reads 90 days cleanly | Pay-As-You-Go **$0.20 / 100k commands** (with configurable spend limit) or **$10/mo** fixed |
| **Netlify Blobs** | **$0/mo** inside Netlify's **300 credits/month** free pool (shared across builds, 20 credits/GB bandwidth, ~10 credits/GB-hr function compute) | Read-modify-write object store (eventual consistency; unsharded concurrent writes can race under bursts) | Personal **$9/mo** (1,000 credits) or Pro **$20/mo** (3,000 credits) |

**Projected Usage on Jugnu (assuming ~1,000 active daily kid sessions, batched 5 events/request):**
- Client batches: ~4–8 POSTs/session -> ~150k–240k Netlify Function invocations/month (well within Netlify compute credits when batched).
- Upstash Redis: ~1–2 `HINCRBY` commands per event -> ~180k–350k commands/month, comfortably inside **Upstash's 500,000 free monthly commands (\$0/mo)**.

---

## 3. Product Event Catalog & Audited Changes

All 26 centralized events (`game_started`, `game_completed`, `game_restarted`, `level_completed`, `game_exited`, `difficulty_selected`, `drawing_started`, `drawing_saved`, `drawing_exported`, `brush_selected`, `coloring_started`, `coloring_completed`, `template_selected`, `subject_selected`, `practice_started`, `practice_completed`, `tracing_completed`, `worksheet_downloaded`, `worksheet_printed`, `badge_earned`, `achievement_unlocked`, `section_viewed`, `activity_selected`, `feature_used`, `theme_changed`, `language_changed`) enforce predefined slugs and `EVENT_PARAM_ALLOWLIST`.

**Audit findings fixed:**
- Moved `Runner.tsx` new-best `achievement_unlocked` emission out of React's `setBest` state updater so React StrictMode double-invocations cannot double-count achievements.
- Enforced strict `PARENT_MARKETING_SECTIONS` isolation inside `Ga4Transport`.
- Verified zero user-entered text (`custom` worksheet param, printable textarea entries, canvas strokes, page renames, uploaded image filenames, or quiz answers) is ever emitted or logged.
- Added `Disallow: /insights` & `/.netlify/` to `public/robots.txt`, `X-Robots-Tag: noindex, nofollow` + `Cache-Control: no-store` in `public/_headers`, and `noindex,nofollow` metadata in `src/data/seo.ts`.

---

## 4. Security, Abuse Protection & Privacy Limitations

- **Abuse defenses:** Strict `POST` + same-origin verification (`https://jugnu.fun`, `https://www.jugnu.fun`), `4 KB` body cap, `<= 10` events per batch, strict slug/PII regex rejection on server (`400`), `60 req/min` sliding rate limiter on ingestion (`429`), and `10 attempts / 15 min` login brute-force limiter (`429`).
- **Log minimization:** Handlers never log `request.body`, raw headers, IPs, `User-Agent`, or user input. Rate-limit keys use an ephemeral cold-start-salted SHA-256 hash kept strictly in volatile RAM.
- **Mathematical limitations of aggregate-only rates:** Because Jugnu stores **no session or user IDs**, completion rates (`completions / starts`) and abandonment rates (`exits / starts` or `max(0, starts - completions) / starts`) are aggregate window ratios rather than per-user funnels. Near UTC day rollovers, a session started before `00:00 UTC` and finished after `00:00 UTC` can skew single-day boundary ratios slightly (weekly/monthly windows smooth this out).

---

## 5. Deployment Instructions (When Explicitly Approved)

Do **not** set these variables until owner privacy review is complete:

1. Create a free **Upstash Redis** database and copy REST URL + token.
2. Generate an `scrypt` password hash for **Jugnu Insights**:
   ```bash
   node -e "const c=require('crypto'),s=c.randomBytes(16).toString('hex'),p=process.argv[1];console.log('scrypt:'+s+':'+c.scryptSync(p,s,32).toString('hex'))" 'YOUR_STRONG_PASSPHRASE'
   ```
3. Configure Netlify Environment Variables:
   - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`
   - `JUGNU_INSIGHTS_PASSWORD_HASH` (output from step 2)
   - `JUGNU_INSIGHTS_SECRET` (`>= 32` random hex characters: `openssl rand -hex 32`)
   - `JUGNU_AGGREGATE_COLLECTION_ENABLED=true`
   - `VITE_ANALYTICS_ENABLED=true`
   - `VITE_AGGREGATE_ANALYTICS_ENABLED=true`
   - Leave `VITE_GA4_ENABLED=false` and `VITE_ANALYTICS_CHILD_PRIVACY_APPROVED=false` unless parent-page GA4 tracking is separately approved after privacy review.
4. Update `/information/privacy` to describe anonymous aggregate feature counters and deploy on Netlify.

---

## 6. Testing Instructions

```bash
# 1. Server-side validator, auth, rate-limit, storage & rollup unit tests
node --test test/unit/analytics-backend.test.mjs

# 2. Typecheck, Vite production build & SSR prerendering
npm run build

# 3. End-to-end Playwright suite (mock events, PII guard, GA4 gating & Jugnu Insights UI)
npx playwright test test/e2e/analytics.spec.ts
```

---

## 7. Remaining Requirements Before Production Activation

1. Owner review of this implementation, [InsightsPage.tsx](src/pages/InsightsPage.tsx), and Netlify function behavior.
2. Confirm `/information/privacy` copy reflects first-party aggregate-only event counting.
3. Confirm whether parent-only marketing GA4 (`G-JZV578ZF17`) should stay permanently off or undergo COPPA / GDPR-K / India DPDP legal review before enabling.
4. Provision Upstash Redis + Netlify secrets above and deploy.
