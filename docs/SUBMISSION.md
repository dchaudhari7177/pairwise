# Submission form answers

Plain text, ready to paste into the Google Form. Each answer stands on its own.

---

## 1. What is your go-to-market & scaling strategy?

Pairwise starts with an advantage no dating app has: around 1 million eLitmus candidates (2020–23 batches), now 23–28, many of whom moved cities for their first job. Their identity was already verified at a proctored test, and their college (often their employer too) is known. So our acquisition cost is close to zero, and trust is built in from day one. It's also a proven move: Info Edge (Naukri) owns the dating app Aisle through Jeevansathi.

PHASE 0 · Bengaluru closed beta (weeks 0–6)
• eLitmus sends a one-time, opt-in invitation to Bengaluru-based candidates who agreed to receive updates. Nothing is migrated: people sign up fresh and verify with consent, which respects the DPDP Act's purpose limitation.
• Women are invited first. Men join from a waitlist as the gender balance allows, and can skip the queue if a verified member vouches for them.
• A city opens only at a liquidity threshold: about 1,500 verified members with 40% or more women. The maths: after orientation (~½), age range (~40%) and intent compatibility (~80%), that gives each person about 240 compatible profiles, roughly seven weeks of 5-a-day picks without repeats. We never launch to an empty room.
• This rule is built into the app, not just this plan. Sign up in a city that isn't open and you join its waitlist and see how close it is. In an open city, a man looking for women waits in a first-come line whenever admitting him would take women below 40%. A vouch from a verified member (3 each) is the only way to skip the line, and there's no paid shortcut. The founder console shows each city's progress and admits the next balanced batch. Demo: vivek@pairwise.demo.
• Illustrative funnel: 50,000 invited → 5,000 waitlist → 3,000 verified profiles.

PHASE 1 · Pune and Hyderabad, then Chennai and NCR (months 2–6)
• Each city opens from its own waitlist once it crosses the threshold.
• Puzzle Nights: ticketed, verified-only mixers at partner cafés. They fit the eLitmus brand, generate content, bring in members and earn revenue.
• Vouches (3 per member) make growth carry a trust signal.
• "New to the city" relocation guides for the cohort that just moved.

PHASE 2 · Beyond eLitmus (months 6–12)
• Open to any verified professional (work email, already built, plus DigiLocker documents with consent).
• Native apps through a Capacitor wrapper once PWA retention is proven; Hindi and regional languages.
• Paid acquisition only when CAC is below 6 months of revenue per member.

PHASE 3 · Year 2
• A "New in the city" friends mode on the same verified, safe base; an events marketplace; couples' success stories driving referrals.

HOW THE PRODUCT EVOLVES
Our north star is Weekly Meaningful Conversations (both people send 8+ messages), not time spent in the app. The founder console in the app tracks five hypotheses live (pick decision rate, ghost rate, Spark vs no-Spark conversation depth, the gender gap in time to first match, and chats that become dates), each tied to a product lever. For example, if men's time to first match drifts far from women's, we tighten the waitlist and attention balancing.

SCALING
Picks become a nightly job per city, chat moves to realtime listeners, and analytics moves to BigQuery. Trust & safety grows from rules plus a small moderation team to a classifier trained on resolved reports. Firestore and Vercel scale without re-platforming.

---

## 2. How do you plan on monetising the app?

My answer to "users don't want to pay" is: mostly, they won't have to. About three-quarters of projected revenue comes from businesses that want access to a verified, high-intent audience that actually goes on dates.

WHAT STAYS FREE, FOREVER
Verification, every safety tool, 5 Daily Picks, seeing who liked you (the most common paywall in dating), 3 conversations, unlimited Spark puzzles, Date Plan and partner perks. We never sell visibility (no boosts or super-likes, which would undo our fair-attention design), never price by gender, and never sell or ad-target personal data.

WHERE THE MONEY COMES FROM
1. Partner venues (the biggest line): cafés, board-game cafés and workshops pay ₹2,500–5,000 a month to appear in Date Plan, our safe-first-date planner, offering a perk to couples, plus ~₹50 per redeemed date. Couples are weekend footfall they want. Users get value; businesses pay. This works end to end in the app: accepting a date at a partner venue issues a one-time perk code, the venue enters it at its counter on the day (pairwise-pi.vercel.app/partners/redeem), and each redemption is billed. Venues apply through a For venues page that enforces a first-date safety checklist. The founder console shows the revenue mix, venues against Plus, so we notice if we drift toward squeezing users.
2. Pairwise Plus (₹299/month or ₹699/quarter, GST included): 10 picks instead of 5, 5 conversation slots instead of 3, and Relocation mode (meet people in the city you're moving to before you move), which is very relevant for this cohort. It's convenience, not advantage. Payment is web-based (UPI AutoPay), so there's no app-store commission, and cancelling takes one tap.
3. Events: verified-only Puzzle Nights at ~₹399 a ticket, revenue-shared with venues.
4. Sponsored Sparks: brands (coffee, travel, books) sponsor puzzle packs. Contextual only, no data targeting.
5. Later: "Verified with Pairwise" identity as a service for rental and flatmate platforms, with user consent.

ILLUSTRATIVE ECONOMICS, ONE MATURE CITY (30k verified, 15k monthly active, a conservative 4% on Plus)
• Plus: 600 × ~₹260 = ₹1.56L/month (26%)
• Venues: 60 × ₹3,000 + 2,000 redemptions × ₹50 = ₹2.8L (47%)
• Events: 8 × 40 × ₹399 at 50% margin = ₹0.64L (11%)
• Sponsored Sparks: ₹1L (17%)
Total ≈ ₹6L a month, ≈ ₹72L a year per city, ≈ ₹3.6 crore a year across five cities. CAC for the founding cohort is near zero, and infrastructure costs are small at this scale.

So the monetised part of the app is the Date Plan surface (venues, perks, events) plus convenience features in Plus. That puts revenue at the step where members most need help (getting from chat to a safe first date), so our incentives line up with theirs.

---

## 3. Your hypothesis & assumptions

TARGET SEGMENT
Early-career professionals aged 22–30 in tier-1 tech cities, often from tier-2/3 hometowns and non-elite colleges (the eLitmus base), who want a real relationship (now or within a few years) and are tired of fake profiles and endless swiping. Not for hookups, not for caste-sorted matrimony, never under 18.

THE PROBLEMS (from observation and data)
• Trust: McAfee's 2026 research says 75% of Indians have run into fake or AI-looking dating profiles, and 1 in 7 have lost money to romance scams.
• Gender imbalance made worse by design: about 3 men for every woman (Woo survey: 26% women). Infinite swiping floods a few profiles and starves the rest, so both sides leave.
• Conversations die and ghosting is normal.
• The middle is missing: swipe apps feel casual, and matrimony sites are parent-led and caste-sorted.
• People fear colleagues or relatives seeing their profile.

KEY FEATURES AND USPs
1. Verified-only: nobody can like or message until verified (eLitmus Verify or a work email). Verification is our moat, so we give it away.
2. Daily Picks with fair attention: 5 explained picks a day; profiles already flooded with likes are shown to fewer people; at most 10 new likes are delivered to anyone per day. This fixes the root cause of the gender-ratio spiral.
3. Spark: a two-player puzzle where each person holds half the clues, so the only way to solve it is to talk. Puzzles are eLitmus's DNA, and it replaces "hi".
4. No ghosting by design: 3 open slots, close kindly in one tap, chats quiet for 7 days expire.
5. Private from your world: hide from your verified employer and college; photos blurred until match, enforced on the server.
6. Safe from first message to first date: Scam Shield flags money, UPI, crypto and early off-platform pressure; Date Plan needs mutual consent, uses public venues, shares the plan with a friend, and ends with a private check-in.
7. Values and life-plan matching (timeline, kids, family setup, relocation) with no caste filters, by principle.

WHY WE WIN AGAINST ESTABLISHED APPS
• A trust moat they can't copy cheaply: eLitmus has proctored-test identity verification for a million people.
• Near-zero acquisition cost through owned channels, while incumbents spend heavily to acquire unverified users.
• Product mechanics that fix the market rather than monetise its dysfunction. Incumbents earn from paywalls on "who liked you" and from boosts; we can't be copied without them giving up that revenue.
• Positioning in the serious-but-self-led middle that neither swipe apps nor matrimony sites serve well.
• Revenue mostly from businesses, so we don't need to squeeze users.

KEY ASSUMPTIONS (and how the pilot tests them)
• About 10% of invited eLitmus alumni join the waitlist, and women value a verified pool more than a large one. Measured by waitlist conversion and women's D30 retention.
• 5 picks a day feels considered, not limiting: at least 40% of picks get a decision (H2).
• Slots and expiry cut ghosting below 25% (H3).
• Spark chats go deeper than non-Spark chats (H4). Measured with a randomised experiment, not a correlation: half of new matches get a Spark suggestion, assigned by a hash of the match id, and the founder console reports the lift with a confidence interval, a p-value and the sample size still needed. Pilot data isn't enough yet, and the console says so.
• Attention balancing narrows the gender gap in time to first match (H5).
• Safety features lead to dates: at least 15% of conversations reach a plan (H6).
• Venues will pay for verified couple footfall. We start with a free first month, then charge; redeemed perk codes are the proof of value we show them.
• Members accept that dating data never flows back to eLitmus. That firewall is also the legal requirement and the brand promise.

All of this is live in the working app: a founder console tracks every hypothesis against its target, runs the H4 experiment, shows weekly retention cohorts, controls city launches, and shows who pays. The demo accounts walk through each feature.
