# Monetisation

> Users don't want to pay, and mostly they shouldn't have to. Pairwise makes
> most of its money from businesses that want access to a verified,
> high-intent audience that actually goes on dates.

## Principles

1. **Never charge for safety, verification, or knowing who likes you.**
   "See who liked you" is the most common paywall in dating; here it's free.
2. **No pay-to-be-seen.** Boosts and super-likes would undo attention
   balancing, which is the core of the product.
3. **No gender-based pricing.** Fairness comes from the design, not discounts.
4. **No selling or ad-targeting on personal data.** Sensitive data is used
   only for matching.
5. **Web-first payments.** A PWA with UPI AutoPay avoids app-store commissions.

## Revenue lines

| # | Line | Who pays | Price | Why they pay |
|---|---|---|---|---|
| 1 | **Partner venues** | Cafés, board-game cafés, workshops | ₹2,500–5,000 per month listing, plus ~₹50 per redeemed date | Weekend footfall from couples, and a "safe date venue" badge |
| 2 | **Pairwise Plus** | Busy professionals, relocators | ₹299/month · ₹699/quarter (GST incl.) | 10 picks, 5 slots, Relocation mode: convenience, not advantage |
| 3 | **Events** | Members | ~₹399 per ticket | Verified-only Puzzle Nights; meeting people is easier in a group |
| 4 | **Sponsored Sparks** | Brands (coffee, travel, books) | ₹50k–2L per pack-month | Playful, contextual brand moments without data targeting |
| 5 | Later: trust-as-a-service | Rental, flatmate and marketplace platforms | Per verification | "Verified with Pairwise" identity, with user consent |

### Which part of the app is monetised?

- **Free forever:** verification, all safety tools, 5 Daily Picks, seeing who
  liked you, 3 conversations, unlimited Sparks, Date Plan, partner perks.
- **Plus:** volume and convenience (more picks and slots) and Relocation mode.
- **The Date Plan surface** is where business revenue happens: venues,
  perks, events. It's also the step where members most need help, which
  lines up revenue with the outcome.

## Unit economics (illustrative, one mature city)

Assumptions: 30,000 verified members, 15,000 monthly active, 4% of MAU on
Plus (deliberately conservative), blended Plus price about ₹260/month.

| Line | Calculation | Monthly | Share |
|---|---|---:|---:|
| Plus | 600 × ₹260 | ₹1,56,000 | 26% |
| Venues | 60 × ₹3,000 + 2,000 redemptions × ₹50 | ₹2,80,000 | 47% |
| Events | 8 events × 40 × ₹399 × 50% margin | ₹63,840 | 11% |
| Sponsored Sparks | 1 brand | ₹1,00,000 | 17% |
| **Total** | | **≈ ₹6,00,000** | |

- About **₹72 lakh a year per mature city**, or about **₹3.6 crore a year
  across five cities**, with about three-quarters from businesses.
- **Costs at this scale** are dominated by people (moderation, partnerships),
  not infrastructure: Firestore and Vercel cost tens of thousands of rupees a
  month at this volume.
- **CAC** for the founding cohort is close to zero (owned eLitmus channels).
  Phase 2 paid acquisition is gated on CAC < 6 months of blended revenue.

## Why this works for eLitmus

- It's a new revenue line from an asset eLitmus already has (verified alumni
  and brand trust), without touching hiring data.
- It builds alumni engagement beyond the job search, which strengthens the
  brand with the same people who'll later hire through eLitmus.
- A separate entity ring-fences risk while keeping the upside.

## What we'd validate first

1. Will 10 cafés in Koramangala and Indiranagar list for free in exchange for
   perks, and how many redemptions follow? That's the evidence for paid listings.
2. Plus conversion among men aged 26–30 and among people who use Relocation mode.
3. Puzzle Night sell-through and the share of attendees who match afterwards.
