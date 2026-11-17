# Go-to-market & scaling strategy

## The starting position

- **Audience:** about 1M eLitmus candidates from the 2020–2023 batches, now
  23–28, many of whom relocated for work. Prime dating age, at the hardest
  moment to meet people.
- **Unfair advantage:** identity already verified at a proctored test,
  verified education, often verified employer. Plus warm, owned channels to
  reach them at close to zero acquisition cost.
- **Precedent:** Info Edge (Naukri) owns the dating app Aisle through its
  matrimony arm Jeevansathi (76% in 2022, full ownership in 2025).

## Principles

1. **Never launch to an empty room.** Cities open only at a liquidity threshold.
2. **Protect the ratio.** A dating market lives or dies on women's experience.
   Women are invited first; men come in from a waitlist as the balance allows.
3. **Consent before contact.** eLitmus data was collected for hiring. Under the
   DPDP Act's purpose limitation, nothing is migrated. eLitmus sends a single
   opt-in invitation, and people sign up fresh and verify with consent.
4. **Grow through trust.** Vouches and events attach a trust signal to growth.

## Phase 0: Bengaluru closed beta (weeks 0–6)

| Lever | Detail |
|---|---|
| Invitation | One-time email and dashboard banner from eLitmus to Bengaluru-based 2020–23 candidates with marketing consent |
| Waves | Women first; men from a waitlist, skipping the queue with a vouch from a verified member |
| Threshold | Open when there are about 1,500 verified members and 40% or more are women |
| Founding cohort | Founding-member badge, direct line to the team, 20 user interviews a week |
| Measurement | Founder console: WMC (north star), H2–H6, the women's share |

**Why 1,500?** After orientation (~½), age range (~40%) and intent/kids
compatibility (~80%), each person has about **240 compatible profiles**:
roughly seven weeks of 5-a-day picks without repeats. Below that, picks
repeat or run dry and retention collapses.

**Illustrative funnel:** 50,000 invited → 10% join the waitlist (5,000) →
60% verify and finish profiles (3,000) → threshold met in weeks 4–6.

## Phase 1: Pune and Hyderabad, then Chennai and NCR (months 2–6)

- Each city has its own waitlist and opens when it crosses the threshold.
- **Puzzle Nights:** monthly ticketed mixers at partner cafés for verified
  members only. They fit the brand, create shareable content, bring in new
  members, and earn revenue.
- **Vouches:** 3 per member. Growth with built-in accountability.
- **Relocation content:** "New to Bengaluru / Pune / Hyderabad" guides,
  promoted to the cohort that just moved and tied to Plus Relocation mode.
- **PR angle:** "the dating app that verifies everyone", backed by the scam
  statistics.

## Phase 2: Beyond the eLitmus base (months 6–12)

- Open to any verified professional: work-email verification (already built)
  plus DigiLocker documents with consent, through an authorised partner.
- Native apps through a Capacitor wrapper once PWA retention is proven.
  Hindi and regional-language UI.
- Paid acquisition only once CAC is below about 6 months of blended revenue
  per member.

## Phase 3: Year 2 and beyond

- **"New in the city"** friends mode: same verification, platonic intent. It
  reuses the whole safety stack for a different job.
- **Events marketplace:** partners list experiences and members book them.
- **Couples graduate:** success stories drive referrals, and an opt-in
  "we met on Pairwise" fuels word of mouth.

## Evolving the product

| Signal | Product response |
|---|---|
| Pick decision rate < 40% (H2) | Improve reasons and ranking; test 4 or 6 picks |
| Ghost rate > 25% (H3) | Earlier nudges; shorter expiry; "your turn" emphasis |
| Spark chats don't go deeper (H4) | New puzzle formats or demote Spark |
| Men's time to first match ≫ women's (H5) | Tune attention balancing; tighten the waitlist |
| Few chats become dates (H6) | More venues and perks; a nudge at 20 messages |

## Scaling the organisation and the tech

- **Trust & safety:** rules plus about 1 moderator per 20k monthly users at
  first, then a classifier trained on resolved reports, with humans on appeals.
- **Ranking:** from hand-tuned weights to a learned model (trained on mutual
  likes, conversation depth and check-ins) that keeps the fairness constraints.
- **Infra:** nightly picks job per city; realtime chat; BigQuery analytics.
  Firestore and Vercel scale without a re-platform.
