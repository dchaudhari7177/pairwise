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

### What's built

The venue line works end to end, not just on paper:

1. Accepting a date at a partner venue issues a one-time perk code (`PW-…`)
   on the Date Plan card.
2. The venue enters it at `/partners/redeem` on the day of the date. It works
   once, only at that venue, and is void if the date was changed or cancelled.
3. Each redemption is a billable event (₹50), on top of the monthly listing.
4. Venues apply at `/partners`, which refuses venues that fail the first-date
   safety checklist up front.
5. The founder console shows the **revenue mix**, venues against Plus. If Plus
   ever dominates, that's the warning sign that we're drifting toward
   squeezing users.

## Unit economics (illustrative, one mature city)

Computed by `src/lib/economics.ts` and pinned by `tests/economics.test.ts`, so
if an assumption changes, the test fails until this page changes too. The same
model is interactive at `/why#model` and in the founder console.

Assumptions (base case): 30,000 verified members, 15,000 monthly active, 4% of
actives on Plus, 60% of them monthly. **Member prices include 18% GST**, and the
gateway takes ~2%, so ₹299 is ₹248 of revenue and the blended Plus figure is
~₹226 per member per month. B2B invoices add GST on top, so venue and sponsor
fees are revenue at face value.

| Line | Calculation | Monthly | Share |
|---|---|---:|---:|
| Plus | 600 × ~₹226 net | ₹1,36,000 | 24% |
| Venue listings | 60 × ₹3,000 | ₹1,80,000 | 32% |
| Redeemed perk dates | ~2,000 × ₹50 | ₹1,00,000 | 18% |
| Puzzle Nights | 8 × 40 × ₹338 net × 50% to us | ₹53,000 | 9% |
| Sponsored Sparks | 1 brand | ₹1,00,000 | 18% |
| **Revenue** | | **≈ ₹5,70,000** | |
| City costs | city lead ₹45k, 2 moderators ₹70k, infra ₹3/active, marketing ₹40k | −₹2,00,000 | |
| **Contribution** | | **≈ ₹3,70,000** (65%) | |

- **Two-thirds of revenue is paid by businesses** (venues and sponsors), not members.
- **Company break-even:** a ₹6L/month central team (founder/PM, two engineers, a
  T&S lead, legal and accounting retainers) is covered by **two mature cities**.
  Five cities: about ₹3.4 crore revenue and ₹1.5 crore operating profit a year.
- **A new city is an investment.** It covers its own costs only from about
  **4,300 verified members**, so a city opened at the 1,500 launch line loses
  money for a while. That's why cities open one at a time.
- **The conservative case** (20k verified, 40% active, 2.5% Plus, 35 venues) needs
  **seven** cities to break even, and five cities lose about ₹14 lakh a year. That's
  the scenario the go/no-go gate exists to catch early.
- **CAC** for the founding cohort is close to zero (owned eLitmus channels).
  Phase 2 paid acquisition is gated on CAC < 6 months of contribution per member.

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
