import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Founder's notes",
  description: "Why Pairwise exists, who it's for, how it makes money and grows, and the decisions behind every feature.",
};

const TOC = [
  ["asset", "The unfair advantage"],
  ["broken", "What's broken"],
  ["who", "Who it's for"],
  ["decisions", "Decisions & trade-offs"],
  ["not", "What we refused to build"],
  ["gtm", "Go-to-market & scaling"],
  ["money", "Monetisation"],
  ["legal", "Legal & trust"],
  ["risks", "Risks & how we'd know"],
  ["tech", "How it's built"],
] as const;

function Section({ id, n, title, children }: { id: string; n: number; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line pt-10">
      <p className="eyebrow">{String(n).padStart(2, "0")}</p>
      <h2 className="mt-2 text-3xl font-semibold">{title}</h2>
      <div className="prose-pw mt-4">{children}</div>
    </section>
  );
}

function Decision({ problem, choice, why, cost }: { problem: string; choice: string; why: string; cost: string }) {
  return (
    <div className="card my-4 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Problem</p>
      <p className="mt-1 font-semibold">{problem}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-rose-2">Decision</p>
      <p className="mt-1 font-display text-lg leading-snug">{choice}</p>
      <p className="mt-3 text-sm text-ink-2">
        <strong className="text-ink">Why:</strong> {why}
      </p>
      <p className="mt-2 text-sm text-ink-2">
        <strong className="text-ink">Trade-off we accept:</strong> {cost}
      </p>
    </div>
  );
}

export default function WhyPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[14rem_1fr]">
      <aside className="hidden lg:block">
        <nav className="sticky top-24 space-y-1 text-sm">
          <p className="eyebrow mb-3">Contents</p>
          {TOC.map(([id, label], i) => (
            <a key={id} href={`#${id}`} className="block rounded-lg px-2 py-1.5 text-ink-2 hover:bg-paper-2 hover:text-ink">
              <span className="mr-2 text-muted">{String(i + 1).padStart(2, "0")}</span>
              {label}
            </a>
          ))}
        </nav>
      </aside>

      <article className="max-w-3xl">
        <p className="eyebrow">Founder&apos;s notes</p>
        <h1 className="mt-3 text-5xl font-semibold leading-tight">Why Pairwise looks the way it does</h1>
        <p className="mt-5 text-xl leading-relaxed text-ink-2">
          The brief was to own a dating app end to end for eLitmus&apos;s million-strong candidate base, and not to build another
          Tinder clone. These notes explain the reasoning behind each decision, including what I chose <em>not</em> to build.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            ["Thesis", "Verification is the moat; fairness is the product; safety is the brand."],
            ["North star", "Weekly Meaningful Conversations: both people send 8+ messages."],
            ["Money", "About three-quarters of projected revenue comes from businesses, not users' pockets."],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-paper-2/70 p-4">
              <p className="eyebrow">{k}</p>
              <p className="mt-1 text-sm text-ink-2">{v}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 space-y-12">
          <Section id="asset" n={1} title="The unfair advantage">
            <p>
              eLitmus has over a million candidates from the 2020–2023 batches. In 2026 they&apos;re <strong>23 to 28 years old</strong>,
              in their first or second job, and very often living in a city they moved to for that job. That&apos;s the prime dating
              age, at the exact moment of their lives when meeting people is hardest.
            </p>
            <p>
              More valuable than the size is what eLitmus <em>knows</em>: each of them sat a <strong>proctored test with a photo-ID
              check</strong>, has a <strong>verified college and graduation year</strong>, and for many, a <strong>verified employer</strong>.
              Dating apps spend heavily on acquisition and still can&apos;t verify anyone. We can reach a warm, verifiable audience at
              close to zero acquisition cost.
            </p>
            <p>
              It&apos;s been done before, too. <strong>Info Edge, the parent of Naukri.com, bought 76% of the dating app Aisle in 2022</strong>
              through its matrimony arm Jeevansathi, and moved to full ownership in 2025. A careers company running a dating product is a
              proven model.
            </p>
          </Section>

          <Section id="broken" n={2} title="What's broken in Indian dating">
            <ul>
              <li>
                <strong>Trust.</strong> McAfee&apos;s 2026 research found 75% of Indians have run into fake or AI-generated-looking
                profiles, and 1 in 7 have lost money to a romance scam.
              </li>
              <li>
                <strong>The gender ratio, made worse by design.</strong> Woo&apos;s 2018 survey of 20,000 urban Indians found only 26%
                of dating-app users were women. With infinite swiping, a few profiles get flooded and most get silence, so both sides
                churn.
              </li>
              <li>
                <strong>Conversations die.</strong> &ldquo;Hi&rdquo; goes unanswered. Ghosting is normal because nothing in the product
                discourages it.
              </li>
              <li>
                <strong>The middle is missing.</strong> Swipe apps read as casual. Matrimony sites are parent-led and sorted by caste
                and community. People who want something serious but self-led have few good options.
              </li>
              <li>
                <strong>Privacy from your own world.</strong> For many young Indians, the biggest fear is a manager, a colleague or a
                relative finding their profile.
              </li>
            </ul>
          </Section>

          <Section id="who" n={3} title="Who it's for (and who it isn't)">
            <p>
              <strong>Early-career professionals, 22–30, in tier-1 tech cities</strong>, often from tier-2 or tier-3 hometowns and
              non-elite colleges: exactly the eLitmus base. They want a real relationship now or in a few years, and are tired of fakes
              and endless swiping.
            </p>
            <p>
              <strong>Not for:</strong> hookups (there&apos;s no casual intent), caste-sorted matrimony (there are no caste filters),
              and anyone under 18.
            </p>
            <p>
              Two personas shaped every screen. <strong>Meera</strong> (25, analyst, Bengaluru via Mysuru) deleted two apps after a flood
              of low-effort messages and a scam attempt, and needs her team lead never to see her profile. <strong>Aarav</strong> (26,
              engineer, Bengaluru via Indore) is thoughtful in person but invisible on swipe apps. Both are demo accounts on the{" "}
              <Link href="/#demo">home page</Link>.
            </p>
          </Section>

          <Section id="decisions" n={4} title="Decisions & trade-offs">
            <Decision
              problem="Fake profiles and scams make women leave."
              choice="Verified-only. Nobody can like or message until their identity is verified, through eLitmus Verify or a work email."
              why="Trust is the one thing incumbents can't copy cheaply, and it's what our audience is missing most. Verification is our moat, so we give it away instead of upselling it."
              cost="A smaller pool and more friction at sign-up. We'd rather grow slower with real people."
            />
            <Decision
              problem="Infinite swiping floods a few profiles and starves the rest."
              choice="Daily Picks (5 a day), ranked by compatibility × attention balance: people sitting on lots of unread likes are shown to fewer newcomers, and an inbound cap delivers at most 10 new likes a day."
              why="Fixing the distribution of attention addresses the root cause of the gender-ratio spiral. Both groups get a reason to stay."
              cost="Less time in the app and fewer swipes to monetise. That's fine: our north star is conversations, not sessions."
            />
            <Decision
              problem="First messages are bad, and conversations stall."
              choice="Spark: a two-player puzzle where each person holds half the clues, so the only way to solve it is to talk."
              why="It's easier to talk while doing something side by side than face to face. Puzzles are also eLitmus's DNA, turned into play rather than a test. The tests prove every puzzle has one answer and can't be solved alone."
              cost="Some people will find it gimmicky. It's optional, and the dashboard tracks whether Spark chats go deeper (H4)."
            />
            <Decision
              problem="Ghosting is the norm."
              choice="Three open conversation slots. Close kindly with one tap and a pre-written goodbye. Chats quiet for 7 days expire. 'Your turn' nudges after 24 hours."
              why="Scarcity makes each conversation matter. A kind goodbye costs one tap, which is less effort than ghosting."
              cost="Power users may feel limited. Plus raises the cap to 5, but never removes it."
            />
            <Decision
              problem="Colleagues, managers and relatives finding your profile."
              choice="Hide from people at my verified employer and from my college, on by default for work. Photos can stay blurred until you match, enforced on the server."
              why="It's only possible because employer and college are verified, so the moat makes the feature possible."
              cost="A slightly smaller pool. Worth it."
            />
            <Decision
              problem="Scams move fast and off-platform."
              choice="Scam Shield: explainable rules that flag money, UPI, crypto and early off-platform pressure. Receivers get a warning; three strikes file an automatic report."
              why="Rules can be explained to users and moderators and tested. A classifier can replace them later behind the same interface."
              cost="Some false positives. Ordinary chat is in the test suite to keep them rare."
            />
            <Decision
              problem="Chats that never become dates, and dates that feel unsafe."
              choice="Date Plan: both opt in first, public venues only between 7 AM and 10 PM, a share-with-a-friend link, and a private check-in afterwards."
              why="Moving from chat to meeting is the outcome we care about, and safety is what makes people willing to do it."
              cost="Less flexibility for first dates, by design."
            />
            <Decision
              problem="Dating apps die in week one when a new city feels empty, or when men outnumber women and the market tips."
              choice="A city launch gate, in code: a city opens at 1,500 verified members; in open cities, men seeking women wait in a first-come line whenever admitting one more would take women below 40%. Women, and men seeking men, are let in at once."
              why="The two failure modes of a dating marketplace are liquidity and balance. Encoding the GTM rule means nobody can quietly trade balance for a growth number. The waitlist screen tells each person their place in line and exactly why."
              cost="Slower sign-up growth, and some men wait. We think an honest line beats a flooded app. Gating only men who seek women avoids penalising people the imbalance doesn't come from."
            />
            <Decision
              problem="Growth that brings in strangers erodes the trust we start with."
              choice="Vouches: each verified member gets three single-use codes. A vouch skips the balance queue (or puts you first in line for a closed city), but can't open a city early. There is no paid way to skip the line."
              why="Referrals that carry a reputation are worth more than referrals that carry a discount. Capping at three keeps them scarce, so they mean something."
              cost="A vouched man can nudge the balance slightly. Three per member keeps it bounded, and the console shows how many in each queue were vouched."
            />
            <Decision
              problem="Users don't want to pay, but we still need revenue."
              choice="Partner venues pay, members don't: a monthly listing plus ₹50 for each redeemed first date, tracked with a one-time perk code that the venue enters at the counter on the day."
              why="It charges at the moment members most want help (getting to a safe first date), for an outcome venues can see: couples at their tables. Only a code and a first name reach the venue."
              cost="Revenue depends on dates actually happening, so we earn only when the product works. That's the incentive we want."
            />
            <Decision
              problem="Every hypothesis rests on other people's surveys (McAfee 2026, Woo 2018), not on our own segment."
              choice="A two-minute anonymous survey at /research, nine taps, each question tied to the decision it informs. The founder console reads the answers by gender, with intervals, and only calls a claim once there are 30+ answers."
              why="Before scaling anything, check the bet with the people it's for. Asking women and men separately matters most: a two-sided market fails if it only works for one side."
              cost="Self-selected and unweighted, so it shows direction, not truth, and the console says so. Anonymity means no follow-up interviews; we chose honest answers over a contact list."
            />
          </Section>

          <Section id="not" n={5} title="What we refused to build">
            <ul>
              <li><strong>Swiping.</strong> It optimises for looks and volume, the opposite of what we want.</li>
              <li><strong>A paywall on &ldquo;who liked you&rdquo;.</strong> It&apos;s the most common dark pattern in dating. It&apos;s free here.</li>
              <li><strong>Paid boosts or super-likes.</strong> Selling visibility would undo attention balancing.</li>
              <li><strong>Caste or community filters.</strong> Faith is optional and display-only. This sets us apart from matrimony sites on purpose.</li>
              <li><strong>Gender-based pricing.</strong> Legally and ethically shaky. Fairness comes from the product, not the price.</li>
              <li><strong>A &ldquo;casual&rdquo; intent.</strong> Focus beats breadth for a young brand tied to eLitmus.</li>
              <li><strong>Data sharing with eLitmus or recruiters.</strong> The firewall is absolute, and it&apos;s also the legal requirement.</li>
              <li><strong>A paid way to skip the waitlist.</strong> Selling places in line would undo the balance rule. A vouch from a real member is the only shortcut.</li>
            </ul>
          </Section>

          <Section id="gtm" n={6} title="Go-to-market & scaling">
            <h3>Phase 0 · Bengaluru closed beta (weeks 0–6)</h3>
            <ul>
              <li>eLitmus sends a <strong>one-time, opt-in invitation</strong> to Bengaluru-based 2020–23 candidates who agreed to receive updates. People sign up fresh; nothing is migrated (DPDP purpose limitation).</li>
              <li><strong>Women-first waves:</strong> women are invited first. Men join from a waitlist as the balance allows, and skip the queue if a verified member vouches for them. <em>This is live: try Vivek&apos;s demo account, or sign up in Chennai.</em></li>
              <li><strong>Liquidity threshold:</strong> a city opens only at about 1,500 verified members with 40% or more women. Why 1,500? After orientation (~½), age range (~40%) and intent/kids compatibility (~80%), each person has about 240 compatible profiles, which is roughly seven weeks of 5-a-day picks without repeats.</li>
              <li>Founding-member badge; weekly interviews with 20 users; the dashboard tracks H2–H6.</li>
            </ul>
            <h3>Phase 1 · Pune and Hyderabad, then Chennai and NCR (months 2–6)</h3>
            <ul>
              <li>Each city opens from its own waitlist once it crosses the threshold, so we never launch to an empty room.</li>
              <li><strong>Puzzle Nights:</strong> monthly ticketed mixers at partner cafés, for verified members only. On-brand, they make content, and they acquire users.</li>
              <li><strong>Vouches:</strong> each member can vouch for 3 friends. Growth comes with a trust signal attached.</li>
              <li><strong>Relocation content:</strong> &ldquo;New to Bengaluru&rdquo; guides for the cohort that just moved, cross-promoted with Relocation mode.</li>
            </ul>
            <h3>Phase 2 · Beyond the eLitmus base (months 6–12)</h3>
            <ul>
              <li>Open to any verified professional: work email plus DigiLocker documents (with consent, through an authorised partner).</li>
              <li>Native apps through a Capacitor wrapper once PWA retention is proven. Hindi and regional-language UI.</li>
            </ul>
            <h3>Phase 3 · Year 2</h3>
            <ul>
              <li>&ldquo;New in the city&rdquo; friends mode, an events marketplace, and couples graduating with success stories that drive referrals.</li>
              <li>Learned ranking from mutual-like and conversation outcomes, kept within the fairness constraints.</li>
            </ul>
            <h3>How the product scales</h3>
            <p>
              Picks become a nightly batch job per city. Chat moves from polling to realtime listeners. Analytics moves to BigQuery. Trust
              &amp; safety grows from rules plus a small human team (about 1 moderator per 20,000 monthly users) to a classifier trained
              on resolved reports.
            </p>
          </Section>

          <Section id="money" n={7} title="Monetisation: users don't want to pay, so mostly they don't">
            <p>
              <strong>The principle:</strong> never charge for safety, verification, or knowing who likes you. Charge for convenience,
              and let <em>businesses</em> pay for access to a high-intent, verified audience that goes on real dates.
            </p>
            <ol className="list-decimal space-y-2 pl-5 text-ink-2">
              <li><strong>Partner venues (B2B, the biggest line).</strong> Cafés, board-game cafés and workshops pay ₹2,500–5,000 a month to be listed in Date Plan and offer a perk, plus about ₹50 per redeemed date. Pairwise couples are weekend footfall they want.</li>
              <li><strong>Pairwise Plus.</strong> ₹299/month or ₹699/quarter: 10 picks, 5 slots and Relocation mode. Aimed at busy professionals and people about to move. Payment is web-based (UPI AutoPay), so there&apos;s no app-store commission.</li>
              <li><strong>Events.</strong> Puzzle Nights at about ₹399 a ticket, profit-shared with the venue.</li>
              <li><strong>Sponsored Sparks.</strong> Brands (coffee, travel, books) sponsor puzzle packs. These are contextual, with no targeting on personal data.</li>
            </ol>
            <div className="card my-6 overflow-hidden">
              <p className="px-5 pt-5 font-semibold">Illustrative monthly revenue: one mature city</p>
              <p className="px-5 text-xs text-muted">Assumptions: 30,000 verified members, 15,000 monthly active, 4% Plus conversion.</p>
              <table className="mt-3 w-full text-sm">
                <tbody className="divide-y divide-line">
                  {[
                    ["Plus: 600 subscribers × ~₹260 blended", "₹1,56,000", "26%"],
                    ["Venues: 60 × ₹3,000 + 2,000 redemptions × ₹50", "₹2,80,000", "47%"],
                    ["Events: 8 × 40 × ₹399, 50% margin", "₹63,840", "11%"],
                    ["Sponsored Sparks: 1 brand", "₹1,00,000", "17%"],
                  ].map(([a, b, c]) => (
                    <tr key={a}>
                      <td className="px-5 py-2.5 text-ink-2">{a}</td>
                      <td className="px-5 py-2.5 text-right font-semibold">{b}</td>
                      <td className="px-5 py-2.5 text-right text-muted">{c}</td>
                    </tr>
                  ))}
                  <tr className="bg-paper-2/70">
                    <td className="px-5 py-2.5 font-semibold">Total</td>
                    <td className="px-5 py-2.5 text-right font-semibold">≈ ₹6,00,000</td>
                    <td className="px-5 py-2.5 text-right text-muted">~₹72L/yr</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Five mature cities come to about <strong>₹3.6 crore a year</strong>, with roughly three-quarters from businesses. For
              eLitmus, it&apos;s a new revenue line from an existing asset, at near-zero acquisition cost for the founding cohort, and it
              never touches hiring data.
            </p>
          </Section>

          <Section id="legal" n={8} title="Legal & trust, designed in">
            <ul>
              <li><strong>DPDP Act 2023 &amp; Rules 2025</strong> (core duties apply from May 2027): itemised, separate consents; purpose limitation (no reuse of hiring data); export and real deletion built in; breach notification; strictly 18+.</li>
              <li><strong>Separate entity from eLitmus:</strong> ring-fences brand and liability, and makes the data firewall structural, not just a policy.</li>
              <li><strong>IT Rules 2021</strong> (intermediary): grievance officer, 24h acknowledgement, 15-day resolution, 24h takedown for intimate imagery. The moderation queue shows these timelines.</li>
              <li><strong>Consumer protection:</strong> the CCPA&apos;s 2023 dark-pattern guidelines: no fake urgency, GST-inclusive prices, one-tap cancel.</li>
              <li><strong>Payments:</strong> RBI e-mandate rules for recurring charges (pre-debit notification).</li>
              <li><strong>Criminal law as product input:</strong> IT Act 66C/66D (impersonation), BNS (stalking, harassment). Verification and reporting make these enforceable.</li>
              <li><strong>Inclusion:</strong> after <em>Navtej Singh Johar</em> (2018), LGBTQ+ members are first-class, with privacy controls that guard against outing.</li>
            </ul>
            <p>
              Read the <Link href="/legal/privacy">privacy notice</Link>, <Link href="/legal/terms">terms</Link> and{" "}
              <Link href="/legal/guidelines">community guidelines</Link>.
            </p>
          </Section>

          <Section id="risks" n={9} title="Risks, and how we'd know early">
            <ul>
              <li><strong>Brand risk for eLitmus:</strong> mitigated by a separate brand, the &ldquo;verified with eLitmus&rdquo; badge only, and a strict firewall.</li>
              <li><strong>Cold start:</strong> mitigated by city-by-city liquidity thresholds and women-first waves.</li>
              <li><strong>Gender imbalance returns:</strong> the 40% gate is on the dashboard; the waitlist throttles men if it slips.</li>
              <li><strong>Scarcity feels limiting:</strong> watch the pick decision rate (H2) and D30 retention; tune the 5 picks and 3 slots.</li>
              <li><strong>Venues won&apos;t pay:</strong> start with free perks in exchange for listing, and charge once redemptions prove footfall.</li>
            </ul>
            <p>
              The <Link href="/#demo">founder console</Link> (admin demo account) shows each hypothesis live against its target.
            </p>
          </Section>

          <Section id="tech" n={10} title="How it's built">
            <ul>
              <li><strong>Next.js 16 + TypeScript</strong>, a mobile-first PWA. One codebase, installable, no app-store tax.</li>
              <li><strong>Firestore</strong> (the pilot runs in the US multi-region, with functions co-located in Washington; at launch it moves to Mumbai) behind a small document-store interface, with an in-memory implementation for tests and local development.</li>
              <li><strong>Pure, tested domain core:</strong> compatibility, fair ranking, Scam Shield and Spark are plain functions, covered by 160+ unit and integration tests.</li>
              <li><strong>Security:</strong> scrypt passwords, signed httpOnly session cookies, same-origin checks, store-backed rate limits, server-enforced photo privacy, and DTOs that never leak private fields.</li>
              <li><strong>Polling chat</strong> (4s, only while visible): robust on serverless and cheap at pilot scale, with a clear path to realtime later.</li>
            </ul>
            <p>
              The source and architecture notes are in the repository README. Every feature here is working, not mocked, except the parts
              that need real-world integrations (eLitmus OAuth, payments, email), which are clearly labelled as simulated.
            </p>
          </Section>
        </div>
      </article>
    </div>
  );
}
