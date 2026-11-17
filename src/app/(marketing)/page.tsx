import {
  BadgeCheck,
  CalendarHeart,
  EyeOff,
  HandHeart,
  Hourglass,
  Lock,
  Puzzle,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { DemoLogin } from "@/components/DemoLogin";
import { Portrait } from "@/components/Portrait";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/seed";

const PILLARS = [
  {
    icon: BadgeCheck,
    title: "Verified, by default",
    body: "Every member is identity-verified before they can like or message. Our founding members were verified in person by eLitmus at a proctored test, which no other app can offer.",
  },
  {
    icon: Hourglass,
    title: "Five picks a day",
    body: "No endless feed. Five thoughtful picks every morning, each with the reasons you might click: shared values, the same life plan, the same hometown.",
  },
  {
    icon: Scale,
    title: "Fair attention",
    body: "Nobody gets 300 likes or none. We cap how many new likes anyone receives a day and give quieter profiles a fair turn, so likes actually get read.",
  },
  {
    icon: Puzzle,
    title: "Spark: start with a shared task",
    body: "Instead of “hi”, solve a two-player puzzle. You each hold half the clues, so the only way through is to talk.",
  },
  {
    icon: HandHeart,
    title: "No ghosting by design",
    body: "Three open conversations at a time. Close one kindly with a single tap. Chats that go quiet for a week end gracefully.",
  },
  {
    icon: EyeOff,
    title: "Private from your world",
    body: "Hide from colleagues at your verified employer and from college batchmates. Keep photos blurred until you match. We blur them on the server, not just on screen.",
  },
];

export default function Landing() {
  return (
    <>
      {/* ------------------------------ Hero ------------------------------ */}
      <section className="relative overflow-hidden">
        <div className="grain pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:pt-20">
          <div className="animate-rise">
            <p className="eyebrow inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 normal-case tracking-normal">
              <ShieldCheck className="h-3.5 w-3.5 text-sage" />
              <span className="text-ink-2">Founding cohort verified with eLitmus · Bengaluru · Pune · Hyderabad</span>
            </p>
            <h1 className="mt-6 text-[2.6rem] font-semibold leading-[1.05] sm:text-6xl">
              Fewer matches.
              <br />
              Real people.
              <br />
              <span className="italic text-rose">Conversations that start themselves.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
              Pairwise is slow dating for India&apos;s early-career professionals: verified-only, five thoughtful picks a day,
              and an icebreaker you solve <em>together</em>. Built for people who moved cities for work and want something real.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/join" className="btn btn-rose">
                Join the founding cohort
              </Link>
              <Link href="#demo" className="btn btn-ghost">
                Try the live demo
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">Free forever for verification, safety and seeing who likes you.</p>
          </div>

          {/* Product vignette */}
          <div className="relative mx-auto w-full max-w-sm animate-rise [animation-delay:120ms]">
            <div className="absolute -left-6 top-10 hidden h-40 w-40 rounded-full bg-rose-soft blur-2xl md:block" />
            <div className="card relative overflow-hidden p-3 shadow-lift">
              <Portrait seed="s_ishita" name="Ishita" className="aspect-[4/4.2] w-full" />
              <div className="p-3">
                <p className="flex items-center gap-1.5 font-display text-2xl font-semibold">
                  Ishita, 25 <BadgeCheck className="h-5 w-5 text-sage" />
                </p>
                <p className="text-sm text-ink-2">UX designer · Koramangala · from Pune</p>
                <div className="mt-3 rounded-xl bg-rose-soft/70 p-3 text-sm">
                  <p className="eyebrow flex items-center gap-1 text-rose-2">
                    <Sparkles className="h-3 w-3" /> Why you&apos;re seeing Ishita
                  </p>
                  <p className="mt-1 text-ink-2">You both value Curiosity, Kindness and Growth · Both into Board games and Puzzles</p>
                </div>
              </div>
            </div>
            <div className="card absolute -bottom-8 -right-4 w-60 animate-pop p-4 shadow-lift [animation-delay:500ms] sm:-right-10">
              <p className="eyebrow flex items-center gap-1.5">
                <Puzzle className="h-3.5 w-3.5 text-rose" /> Spark · The Café Riddle
              </p>
              <p className="mt-2 text-sm text-ink-2">
                <span className="font-semibold text-ink">Your clues:</span> it opens before 9 AM · it has board games
              </p>
              <p className="mt-2 text-xs text-muted">Ishita holds the other half…</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------- Problem ---------------------------- */}
      <section className="border-y border-line bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-3">
          {[
            ["75%", "of Indians have run into fake or AI-generated-looking profiles while dating online."],
            ["1 in 7", "Indians say they have lost money to an online dating or romance scam."],
            ["~3 : 1", "men to women on Indian dating apps, so women get flooded and men get silence."],
          ].map(([n, t]) => (
            <div key={n}>
              <p className="font-display text-5xl font-semibold text-rose">{n}</p>
              <p className="mt-2 text-ink-2">{t}</p>
            </div>
          ))}
          <p className="text-xs text-muted md:col-span-3">
            Sources: McAfee <em>Modern Love</em> research (India, Feb 2026); Woo survey of 20,000 urban Indians (2018: 26% of users
            were women). See the <Link className="underline" href="/why">founder&apos;s notes</Link> for the full reasoning.
          </p>
        </div>
      </section>

      {/* ---------------------------- Pillars ---------------------------- */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <p className="eyebrow">How Pairwise is different</p>
        <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight">Not another swipe app. A calmer, fairer, safer way to meet someone.</h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-paper-2 text-rose">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------- Spark ----------------------------- */}
      <section className="bg-paper-2/70">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2">
          <div>
            <p className="eyebrow">Spark</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">The first conversation already has a topic.</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-2">
              When you match, either of you can start a Spark: a short puzzle where each person sees only half the clues.
              &ldquo;Mine says it&apos;s outdoors. What does yours say?&rdquo; is a much easier opener than &ldquo;hey&rdquo;. And
              solving something together is a tiny shared win.
            </p>
            <p className="mt-4 text-ink-2">
              Puzzles are part of eLitmus&apos;s DNA. Here they become a playful ritual rather than a test, and every one is checked
              by our test suite: exactly one answer, impossible to solve alone.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card p-5">
              <p className="eyebrow text-rose-2">Your clues</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>☕ It serves filter coffee.</li>
                <li>📍 It&apos;s not in Indiranagar.</li>
              </ul>
            </div>
            <div className="card p-5">
              <p className="eyebrow text-rose-2">Their clues</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>⏰ It opens before 9 AM.</li>
                <li>🎲 It has board games.</li>
              </ul>
            </div>
            <div className="card p-5 sm:col-span-2">
              <p className="text-sm text-ink-2">Which café is it?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Brew & Banter", "Third Wave Nook", "Malleshwaram Mess", "Cloud Nine Terrace", "Bookworm Bean"].map((c) => (
                  <span key={c} className={`chip ${c === "Cloud Nine Terrace" ? "bg-sage-soft text-sage" : ""}`}>
                    {c === "Cloud Nine Terrace" ? "✓ " : ""}
                    {c}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm font-medium text-sage">🎉 Solved together in 6 mins</p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------- Safety ---------------------------- */}
      <section id="safety" className="scroll-mt-16 bg-plum text-paper">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="eyebrow text-paper/60">Safety</p>
          <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight">Safe from the first message to the first date.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl bg-plum-2 p-6">
              <ShieldAlert className="h-6 w-6 text-[#f3a6ae]" />
              <h3 className="mt-4 text-xl font-semibold">Scam Shield</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper/75">
                Spots the patterns behind romance scams: money requests, UPI handles, &ldquo;guaranteed returns&rdquo;, and
                pressure to move to Telegram. You see a clear warning next to the message, with one-tap reporting.
              </p>
              <div className="mt-4 rounded-2xl bg-paper/10 p-3 text-xs text-paper/85">
                <p className="rounded-xl bg-paper/10 px-3 py-2">“Can you send 5000 rs to my UPI…”</p>
                <p className="mt-2 text-[#f7cfa0]">⚠ Never send money to someone you haven&apos;t met.</p>
              </div>
            </div>
            <div className="rounded-3xl bg-plum-2 p-6">
              <CalendarHeart className="h-6 w-6 text-[#f3a6ae]" />
              <h3 className="mt-4 text-xl font-semibold">Date Plan</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper/75">
                Both of you opt in before anyone proposes. Pick from busy, public venues. Share who, where and when with a trusted
                friend, with no phone numbers exposed. A private check-in afterwards goes straight to our team if anything felt off.
              </p>
            </div>
            <div className="rounded-3xl bg-plum-2 p-6">
              <Lock className="h-6 w-6 text-[#f3a6ae]" />
              <h3 className="mt-4 text-xl font-semibold">Your data, your call</h3>
              <p className="mt-2 text-sm leading-relaxed text-paper/75">
                Built around India&apos;s DPDP Act. Separate consent for sensitive info, download everything we hold, delete for
                real. Your dating data never flows back to eLitmus or any recruiter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------- Pricing --------------------------- */}
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <p className="eyebrow">Pricing</p>
        <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight">We&apos;ll never charge you to be safe, or to see who likes you.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="card p-7">
            <p className="font-display text-2xl font-semibold">Free</p>
            <p className="mt-1 text-ink-2">Everything you need to meet someone.</p>
            <ul className="mt-5 space-y-2 text-[0.95rem] text-ink-2">
              <li>✓ Verification and all safety tools</li>
              <li>✓ 5 Daily Picks with reasons</li>
              <li>✓ See everyone who liked you</li>
              <li>✓ 3 open conversations, unlimited Sparks</li>
              <li>✓ Date Plan, partner perks and share-with-a-friend</li>
            </ul>
          </div>
          <div className="card relative overflow-hidden p-7 ring-2 ring-rose/30">
            <span className="absolute right-5 top-5 rounded-full bg-rose-soft px-3 py-1 text-xs font-semibold text-rose-2">Plus</span>
            <p className="font-display text-2xl font-semibold">
              ₹299<span className="text-base font-normal text-muted">/month</span>
            </p>
            <p className="mt-1 text-ink-2">Convenience for busy people. ₹699 for 3 months.</p>
            <ul className="mt-5 space-y-2 text-[0.95rem] text-ink-2">
              <li>✓ 10 Daily Picks</li>
              <li>✓ 5 open conversations</li>
              <li>✓ Relocation mode: meet people in the city you&apos;re moving to, before you move</li>
              <li>✓ Cancel in one tap; Plus runs to the end of your period</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ------------------------------ Demo ----------------------------- */}
      <section id="demo" className="scroll-mt-20 border-t border-line bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <p className="eyebrow">For the eLitmus evaluation team</p>
          <h2 className="mt-3 text-4xl font-semibold">Step into a story</h2>
          <p className="mt-3 max-w-2xl text-ink-2">
            Each demo account opens partway through a story, so you can see every feature without waiting for matches. Or{" "}
            <Link href="/join" className="text-rose underline underline-offset-4">
              create your own account
            </Link>{" "}
            and go through verification (simulated) and onboarding yourself. Password for all demo accounts:{" "}
            <code className="rounded bg-paper-2 px-1.5 py-0.5 text-sm">{DEMO_PASSWORD}</code>
          </p>
          <div className="mt-8">
            <DemoLogin accounts={DEMO_ACCOUNTS} password={DEMO_PASSWORD} />
          </div>
          <p className="mt-4 text-xs text-muted">Demo data resets every night, so feel free to like, chat, report and delete.</p>
        </div>
      </section>
    </>
  );
}
