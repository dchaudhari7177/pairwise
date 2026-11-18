import { BadgeCheck, CalendarHeart, IndianRupee, ShieldCheck, Store, Ticket } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CITIES } from "@/lib/options";
import { VENUE_PRICING, VENUES } from "@/lib/venues";
import { ApplyForm } from "./ApplyForm";

export const metadata: Metadata = {
  title: "For venues",
  description: "Partner with Pairwise: verified couples on first dates, sent to safe, public venues. You pay a small listing fee, members pay nothing.",
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function PartnersPage() {
  const partners = VENUES.filter((v) => v.partner);
  const openCities = Object.values(CITIES).filter((c) => c.open).map((c) => c.label);
  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-16 sm:px-6">
        <p className="eyebrow">Pairwise for venues</p>
        <h1 className="mt-3 max-w-3xl text-5xl font-semibold leading-[1.05]">Verified couples, on their first date, walking through your door.</h1>
        <p className="mt-5 max-w-2xl text-lg text-ink-2">
          When two Pairwise members agree to meet, Date Plan suggests a few public, well-run places nearby. Partner venues are listed with a
          small perk for the couple. They get a better first date; you get weekday-evening and weekend footfall from people who have
          both been identity-verified.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="#apply" className="btn btn-love">Apply to list your venue</a>
          <Link href="/partners/redeem" className="btn btn-ghost">
            <Ticket className="h-4 w-4" /> Redeem a perk code
          </Link>
        </div>
      </section>

      <section className="border-y border-line bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-3">
          {[
            { icon: CalendarHeart, title: "How it works", body: "Two members both tap “I'd like to meet”, one proposes your venue, the other accepts. They get a one-time perk code. You enter it at the counter on the day." },
            { icon: IndianRupee, title: "What it costs", body: `${inr(VENUE_PRICING.listingInrPerMonth)} a month to be listed, plus ${inr(VENUE_PRICING.perRedemptionInr)} per redeemed date. First month free in a new city. Members never pay for perks.` },
            { icon: ShieldCheck, title: "What we ask", body: "Busy, public, near transport, and staff who know what to do if a guest feels unsafe. We'd rather list ten great places than a hundred risky ones." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-paper-2 text-rose">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-ink-2">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-3xl font-semibold">Why this is the right thing to charge for</h2>
        <div className="prose-pw mt-4 max-w-3xl">
          <p>
            Most dating apps make money by holding back what members want most (who liked them, more visibility) until they pay. We think
            that turns the product against its users. Pairwise keeps every safety tool and the core experience free, and earns most of its
            revenue here instead: at the step where members need help most, getting from a good conversation to a safe first date.
          </p>
          <p>
            You pay for an outcome you can see: couples at your tables. We don&apos;t sell ads, boost anyone, or share members&apos; data with
            you. You see a code and a first name at the counter, nothing else.
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((v) => (
            <div key={v.id} className="card flex items-start gap-3 p-4">
              <Store className="mt-0.5 h-5 w-5 shrink-0 text-rose" />
              <div>
                <p className="font-semibold">{v.name}</p>
                <p className="text-sm text-muted">{v.kind} · {v.area}, {CITIES[v.city].label}</p>
                <p className="mt-1 text-sm text-amber">🎁 {v.perk}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">Demo partners. Every venue name here is fictional.</p>
      </section>

      <section id="apply" className="scroll-mt-20 bg-paper-2/70">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1.3fr]">
          <div>
            <p className="eyebrow">Apply</p>
            <h2 className="mt-3 text-3xl font-semibold">List your venue</h2>
            <p className="mt-3 text-ink-2">
              We&apos;re live in {openCities.join(", ")}. Applications from other cities join the queue for when we open there. A city
              lead visits before we list you.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink-2">
              <li className="flex gap-2"><BadgeCheck className="h-4 w-4 shrink-0 text-sage" /> No long contract: cancel any month.</li>
              <li className="flex gap-2"><BadgeCheck className="h-4 w-4 shrink-0 text-sage" /> GST invoice every month; pay by UPI or bank transfer.</li>
              <li className="flex gap-2"><BadgeCheck className="h-4 w-4 shrink-0 text-sage" /> One-tap reporting if a guest behaves badly. Verified members are accountable.</li>
            </ul>
          </div>
          <ApplyForm cities={Object.entries(CITIES).map(([id, c]) => ({ id, label: c.label }))} />
        </div>
      </section>
    </div>
  );
}
