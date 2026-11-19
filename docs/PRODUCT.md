# Pairwise: product thesis

> **Fewer matches. Real people. Conversations that start themselves.**
>
> A verified-only, slow-dating app for India's early-career professionals,
> built on the trust eLitmus has already earned with a million of them.

This document explains *why* Pairwise looks the way it does. Every feature in
the app traces back to a problem in this document. If a feature doesn't, it
shouldn't be there.

---

## 1. The asset we start with

eLitmus has over a million candidates from the 2020–2023 graduating batches.
In 2026 they are **23–28 years old**, mostly in their first or second job, and
very often **living in a city they moved to for that job** (Bengaluru, Pune,
Hyderabad, Chennai, NCR).

Three things about this cohort matter more than its size:

| What eLitmus already knows | Why a dating product cares |
|---|---|
| Each candidate sat a **proctored test with photo-ID checks** | We can say "this is a real, identified person", which is the thing dating apps in India fail at most |
| Their **college and graduation year** | Verified education, with no self-declared nonsense |
| For many, the **employer** they joined through eLitmus | Verified work, *and* the ability to hide a profile from colleagues |

Competitors pay heavily to acquire users and still can't verify them. We can
reach a warm, verifiable audience at close to zero acquisition cost. That is the
unfair advantage, and the whole product is designed to make it count.

There's a precedent too. **Info Edge, the parent of Naukri.com, bought 76% of
the dating app Aisle in 2022** through its matrimony arm Jeevansathi, and took
full ownership in 2025. A careers company running a dating product is a proven
model, not a stretch.

## 2. What's broken today (observations)

1. **Trust is broken.** McAfee's 2026 *Modern Love* research found that 75% of
   Indians have run into fake or AI-generated-looking profiles, and 1 in 7 have
   lost money to a romance scam. Women carry most of this risk.
2. **The gender ratio is broken, and the design makes it worse.** Indian dating
   apps have long been ~70–75% men (Woo's 2018 survey of 20,000 people found
   only 26% were women). Infinite swiping means women get flooded and men get
   silence, so **both** sides churn.
3. **Conversations die.** Matches sit idle, "hi" goes unanswered, and ghosting
   is normal because nothing in the product discourages it.
4. **The middle is missing.** Tinder reads as casual. Matrimony sites are
   parent-led and sorted by caste and community. A young professional who wants
   something **serious but self-led** has few good options.
5. **Privacy from your own world.** For many young Indians the biggest fear is
   a colleague, manager or relative finding their profile.
6. **Moving to a new city is lonely.** The cohort we serve is exactly the group
   that just relocated. One survey of Indian singles found a majority feel lonely
   despite being connected online.

## 3. Hypotheses

Each hypothesis is something we expect to be true and can measure. The app is
built to test them.

| # | Hypothesis | Feature that tests it | Success signal |
|---|---|---|---|
| H1 | Verified-only membership is worth more to women than a larger pool | Verified-by-default; unverified accounts can't like or chat | Women's D30 retention ≥ 1.5× a typical dating-app baseline; report rate < 1% of conversations |
| H2 | Scarcity creates attention: 5 thoughtful picks beat 500 swipes | **Daily Picks** with the reasons shown | ≥ 40% of picks get a decision (interested/pass), not a skip |
| H3 | Capping conversations reduces ghosting | **Open Slots** (3 active chats), **Close kindly**, auto-expiry | Ghost rate (match with no reply in 72h) < 25% |
| H4 | A shared task breaks the ice better than "hi" | **Spark**: a two-player puzzle where each person holds half the clues | Matches that play Spark reach 10+ messages 2× as often |
| H5 | Spreading attention fairly keeps both sides engaged | **Attention balancing**: an inbound like cap plus exposure for less-seen profiles | Gap in time to first match between men and women shrinks week on week |
| H6 | Safety features help people meet in person | **Scam Shield**, Date Plan, Share-with-a-friend, post-date check-in | ≥ 15% of active conversations reach a planned date |

### Testing H4 properly: a randomised experiment

Comparing chats that played Spark with chats that didn't is misleading.
People who choose to play a puzzle were probably going to talk more anyway
(selection bias), so the "2×" in the seeded data says little about Spark
itself. The founder console still shows that comparison, labelled
*observational*, next to a **randomised experiment** that answers the real
question:

- **Treatment:** half of all new matches get a chat line suggesting a Spark.
  The other half (control) get nothing extra. Spark itself stays available to everyone.
- **Assignment:** a stable hash of the match id (`spark_nudge_v1`). It needs
  no storage, gives the same answer on every server, and can be recomputed
  for analysis. Changing the salt starts a clean v2.
- **Metric:** share of matches reaching 10+ messages, read 72 hours after
  the match, counted **intent-to-treat** (every match stays in its arm whether
  or not they played).
- **Readout:** rates with 95% Wilson intervals, a two-proportion z-test, and
  the sample size needed to detect a 10-point lift (about 370 matches per arm
  at a 30% baseline). Until both arms reach that size, the console says "keep
  running", even if the gap looks large. With pilot data it does.

That last rule matters most. A founder who ships on n = 8 is reading noise.

### Checking the desk research with our own segment

The observations above come from other people's surveys. So the app carries
its own: a two-minute, anonymous questionnaire at `/research`, shared through
tagged links (`?src=whatsapp`, `?src=linkedin`…) so we also learn which
channel reaches the segment. Each of its nine questions is tied to a decision:

| Question | Decision it informs |
|---|---|
| Would ID verification make you more likely to try an app? | H1, the core bet |
| Five picks a day, or an endless feed? | H2, the daily limit |
| Is a two-player puzzle an easier opener than "hi"? | H4 (stated intent; the experiment measures behaviour) |
| What puts you off most? (up to two) | Which problem leads the pitch: trust, ghosting or attention |
| Used an app this year? Still using it? | How many people incumbents already lost |
| The most you'd pay a month for convenience | Plus pricing, and how much revenue must come from venues |
| Age, gender, city | Segment fit, the split by gender, city launch order |

The founder console reads every claim for women and men separately, with 95%
Wilson intervals, and calls a claim only when the low end of its interval
clears the bar with at least 30 answers. It stores no name, email or IP
address, and strips contact details from the free-text note. The section is
never seeded: it shows only what real people said.

## 4. Who it is for

**Primary:** early-career professionals, 22–30, in tier-1 Indian tech cities,
often from tier-2/3 hometowns and non-elite colleges, who want a real
relationship (now or within a few years) and are tired of fake profiles and
endless swiping.

**Not for (by design):** people looking for hookups, people who want
caste-sorted matrimony, and anyone under 18.

Persona sketches used throughout the app's demo data:

- **Meera, 25, product analyst, Bengaluru (from Mysuru).** She deleted two apps
  after a flood of low-effort messages and one scam attempt. She wants fewer,
  better people, and needs to be sure her team lead can't see her profile.
- **Aarav, 26, backend engineer, Bengaluru (from Indore).** He's thoughtful in
  person but invisible on swipe apps. He wants a fair shot and a way to start a
  conversation that isn't "hi".

## 5. Product principles

1. **Real before many.** Verification is the entry ticket, not an upsell.
2. **Calm by design.** No infinite feed. Scarcity is a feature.
3. **Respect attention on both sides.** Nobody should get 300 likes or 0 likes.
4. **Start with something to do together.** It's easier to talk while doing
   something side by side than while staring at each other.
5. **Private from your world.** You control who in your life can find you.
6. **Safe from the first message to the first date.**
7. **Never monetise safety, verification, or knowing who likes you.** We charge
   for convenience, expression and experiences.
8. **No caste filters. Ever.** Users can share faith or community if they want
   to, but we won't build sorting tools for it. This is a deliberate stance,
   and it sets us apart from matrimony sites.

## 6. The product (what we built)

| Pillar | Features |
|---|---|
| Verified by default | eLitmus Verify (simulated OAuth consent), a work-email OTP fallback, Identity/Education/Work badges |
| Calm discovery | Daily Picks (5 free, 10 with Plus), explainable compatibility, intent and life-plan matching |
| Fair attention | Inbound like cap (10/day, the rest queued for later), exposure for less-seen profiles, ranking that ignores looks |
| Conversations that start themselves | Spark co-op puzzles, likes attached to a prompt with an optional note |
| Anti-ghosting | 3 Open Slots, "Your turn" nudges, Close kindly with templates, 7-day auto-expiry |
| Private from your world | Hide from my company, hide from my college, photos blurred until match (enforced on the server), pause profile |
| Safe | Scam Shield (money, UPI, crypto and off-platform pressure detection), report/block, moderation queue, Date Plan with public partner venues, Share-with-a-friend link, post-date check-in |
| Your data, your call | Download my data (JSON), real account deletion, granular consents |
| Calm notifications | An Activity feed (likes, matches, Spark, date plans, check-ins) with a badge. No "someone viewed you", no streaks |
| Owning the outcome | Founder console with the north-star metric, funnel, city gender balance, a live randomised experiment, weekly retention cohorts, revenue and the report queue |

## 7. North-star metric

**Weekly Meaningful Conversations (WMC):** the number of matches in which *both*
people sent at least 8 messages this week.

Why not DAU or swipes? Because a dating app that succeeds makes people leave it
(they found someone). WMC rewards depth, and it sits right before the outcome
we care about, which is a real date.

Guardrail metrics: women's report rate, ghost rate, the share of women per city,
the gap in time to first match between men and women, and Plus cancellations.

See also: [GTM & scaling](GTM.md) · [Monetisation](MONETIZATION.md) ·
[Legal & compliance](LEGAL.md) · [Architecture](ARCHITECTURE.md)
