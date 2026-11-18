# Architecture

Pairwise is a single Next.js 16 application: a mobile-first PWA plus a JSON
API, deployed on Vercel, with Firestore as the database.

> **Regions.** The pilot database was created in Firestore's US multi-region
> (`nam5`), and a Firestore location can't be changed after creation. So the
> functions run in `iad1` (Washington), next to the data: one long round trip
> per request instead of one per query. For launch, the database moves to
> `asia-south1` (Mumbai) with functions in `bom1`, for latency and DPDP-friendly
> data localisation.

```
 Browser (PWA)                    Vercel · iad1                       Google Cloud · nam5
┌───────────────┐   HTTPS   ┌──────────────────────────┐   Admin SDK   ┌──────────────────────┐
│ React 19 UI   │ ────────► │ Next.js App Router        │ ────────────► │ Firestore            │
│ (server comps │ ◄──────── │  • pages (RSC)            │               │  users, credentials, │
│  + islands)   │   JSON    │  • /api/* route handlers  │               │  likes, matches,     │
└───────────────┘           │  • services (domain core) │               │  messages, reports…  │
                            └──────────────────────────┘               └──────────────────────┘
                                      ▲  nightly cron (03:00 IST) → /api/cron/reset-demo
```

## Layers

| Layer | Where | Responsibility |
|---|---|---|
| UI | `src/app/**`, `src/components/**` | Server Components read data directly through services; small client components handle interaction and call the API. |
| HTTP | `src/app/api/**`, `src/lib/server/api.ts` | Same-origin check, Zod validation, uniform JSON errors. |
| Session | `src/lib/auth/*`, `src/lib/server/viewer.ts` | scrypt password hashes, HS256 JWT in an httpOnly cookie, user re-read on every request (so a suspension applies immediately). |
| Services | `src/lib/services/*` | Use cases: discovery, likes, conversations, Spark, Date Plan, moderation, Plus, data rights, metrics. All take a `DocStore` so they're testable. |
| Domain core | `src/lib/matching`, `src/lib/safety`, `src/lib/spark` | Pure functions: compatibility, fair ranking, Scam Shield, puzzles. No I/O. |
| Storage | `src/lib/store/*` | A five-method `DocStore` interface with Firestore and in-memory implementations. |

## Key design decisions

### A tiny storage interface instead of an ORM
`get / getMany / set / update / remove / query / batch` is all the app needs.
It keeps services honest about access patterns (equality filters only, no
query that needs a composite index) and lets the full test suite run in
memory in under two seconds. The same services run unchanged on Firestore.

### Deterministic document ids
`likes/{from}__{to}`, `matches/{a}__{b}` (sorted), `picks/{uid}_{day}`. Writes
are idempotent, so double taps and retries can't create duplicate likes or
matches, and most flows don't need transactions.

### Daily Picks are computed once per IST day and cached
`picks/{uid}_{YYYY-MM-DD}`. This keeps the "few, considered choices" promise
(no refreshing for better people). It's cheap, since ranking runs once per
user per day, and the cache is also the allow-list for likes: you can only
like someone from today's picks or someone who liked you. At scale this
becomes a nightly batch job per city.

### Inbound cap = scheduled delivery, not rejection
When someone already has 10 likes delivered today, a new like is still
accepted, but with `deliverAt` set to 9 AM on the next day that has capacity.
The sender is told honestly, the recipient is never flooded, and no like is lost.

### Polling chat
The chat polls `GET /api/matches/:id` every 4 seconds, and only while the tab
is visible. On serverless that's more robust than websockets (no sticky
connections), costs about one cheap read per active chat every 4 seconds, and
is easy to reason about. The path to realtime is Firestore listeners with
custom tokens. The service layer wouldn't change.

### Experiments without an assignment table
`src/lib/experiments.ts` assigns each unit to an arm with a 32-bit FNV-1a hash
of `salt:unitId`. Assignment is pure, so there's no table to keep in sync, it
is identical on every function instance, and the analysis can recompute it.
The readout (`src/lib/stats.ts`) is textbook and dependency-free: Wilson
intervals, a pooled two-proportion z-test and a normal-approximation
sample-size estimate, each covered by tests against reference values.

### A derived activity feed
The Activity feed (`src/lib/services/activity.ts`) is computed from likes and
matches on read instead of being stored as notification documents. It can't
drift from the real state, deleting a like or a match removes its items, and
blocked people disappear automatically. One `activitySeenAt` timestamp per
member drives the badge. At scale this becomes a fan-out-on-write collection
feeding web push; the page wouldn't change.

### The launch gate is a pure function

`decide(profile, market, queueLength)` in `services/launch.ts` holds the whole
admission rule and has no I/O, so the tests can cover every branch (closed
city, women, men seeking men, the 40% line, an existing queue) without a
store. Waitlisted members are just `status: "waitlisted"`, and discovery
already shows only `active` members, so no matching code had to change to
keep them out of everyone's picks.

### Perk codes are their own documents

A redemption is keyed by its code, so the venue counter does a single read,
not a search across matches. The match still holds the code, and redemption
checks both, so a changed or cancelled date voids the code without a cleanup
job.

### Server-enforced privacy
- `toCard()` is the only member shape that leaves the server. It never
  includes email, birth date, consents, trust counters or the employer domain.
- "Blur until match" is enforced in `/api/photos/:id`. Viewers who aren't
  entitled receive only the 24px thumbnail.
- The other person's "I'd like to meet" is revealed only once you've tapped it too.

### Cache Components switched off
Every screen is per-user, so the static shell Next 16's Cache Components
would prerender is tiny. Request-time rendering keeps the mental model simple.

## Data model (Firestore collections)

| Collection | Id | Notes |
|---|---|---|
| `users` | `u_…` | Profile, verification, privacy, consents, plan, trust counters, weekly exposure |
| `credentials` | lower-case email | `{ uid, passwordHash }`, kept apart from the profile so it's never read with it |
| `likes` | `from__to` | `status`, `deliverAt`, `deliverDay`, optional note and prompt index |
| `passes` | `from__to` | |
| `matches` | `a__b` | Status, counts, unread, Spark state, meet-readiness, date plan, check-ins |
| `messages` | `matchId_…` | Scam Shield `signals` and receiver-only `tip` |
| `picks` | `uid_day` | Cached daily picks with scores and reasons |
| `reports`, `blocks` | | Moderation |
| `payments` | | Plus (demo provider) |
| `photos` | | JPEG data URLs (640px plus a 24px blur) |
| `shares` | random token | Share-with-a-friend links with expiry |
| `otps`, `ratelimits` | | Work-email codes (hashed), rate-limit buckets |
| `vouches` | the code (`AARAV-7K2P`) | `by`, `usedBy`, `usedAt`: three per verified member, single use |
| `redemptions` | the perk code (`PW-…`) | Issued when a partner-venue date is accepted; `redeemedAt` is what the venue is billed for |
| `venueApplications` | `va_…` | From the For venues form, with the safety checklist |

## Security checklist

- [x] scrypt (N=2^15) password hashing, constant-time compare, dummy hash for unknown emails
- [x] httpOnly, SameSite=Lax, Secure session cookie; `SESSION_SECRET` required in production
- [x] Same-origin check on every mutating request
- [x] Zod validation on every input; length limits everywhere
- [x] Rate limits: sign-up per IP, login per email, messages, OTPs, reports, verification
- [x] Authorisation in services (membership checks on every match operation, admin checks)
- [x] CSP, `X-Frame-Options: DENY`, HSTS, `nosniff`, Permissions-Policy
- [x] No PII in URLs; share tokens are 144-bit random
- [ ] Nonce-based CSP (next step), and Firestore security rules that deny all client access (the app only uses the Admin SDK)

## Testing

`npm test` runs 144 tests (Vitest) covering:

- **Compatibility:** every hard filter, symmetry, reasons
- **Picks:** attention balancing, diversity cap, determinism, activity
- **Scam Shield:** true positives and ordinary chat that must not trip it
- **Spark:** every puzzle brute-forced: exactly one answer combined, more than one with either half alone
- **Services:** likes and matches, the inbound cap, slots, messaging, expiry, Spark flow, Date Plan, moderation, Plus, export and deletion
- **Experiments:** normal CDF/quantile, Wilson, z-test and sample size against reference values; hash assignment is stable, salted and splits ~50/50; only treatment matches get the nudge
- **Activity:** queued likes stay hidden, a like becomes a match, date replies reach the proposer, blocked people vanish, seen marks clear the badge
- **Launch gate:** closed cities, the 40% line, no queue-jumping, men seeking men, batch admission stopping at the line, liquidity maths
- **Vouches and perks:** three single-use codes, skip-the-queue vs closed city, wrong venue, expired and cancelled codes, the IST-day window, the safety checklist
- **Seed:** every demo profile passes real sign-up validation; each demo account's story holds; reset restores it

## Scaling path

| Stage | Change |
|---|---|
| ~10k MAU | As built. Firestore and Vercel free or low tiers. |
| ~100k MAU | Nightly picks job per city (Cloud Run job); counters instead of scans for metrics; BigQuery export; realtime chat listeners. |
| ~1M MAU | Learned ranking (trained on mutual-like and conversation outcomes) within fairness constraints; a T&S classifier trained on resolved reports; photos to Cloud Storage with a CDN; native apps via Capacitor. |
