import { Hourglass, Scale, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/server/viewer";
import { LAUNCH, waitlistView } from "@/lib/services/launch";
import { VouchForm } from "./VouchForm";

export const metadata: Metadata = { title: "You're on the waitlist" };

function Meter({ label, value, target, unit, ok }: { label: string; value: number; target: number; unit: string; ok: boolean }) {
  const pctOfTarget = Math.min(100, Math.round((value / target) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-ink-2">{label}</span>
        <span className={ok ? "font-semibold text-sage" : "font-semibold"}>
          {value.toLocaleString("en-IN")}
          {unit} <span className="font-normal text-muted">/ {target.toLocaleString("en-IN")}{unit}</span>
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-paper-2" role="img" aria-label={`${pctOfTarget}% of target`}>
        <div className={`h-full rounded-full ${ok ? "bg-sage" : "bg-rose"}`} style={{ width: `${Math.max(2, pctOfTarget)}%` }} />
      </div>
    </div>
  );
}

export default async function WaitlistPage() {
  const { store, user } = await requireMember({ allowWaitlisted: true });
  const view = await waitlistView(store, user);
  if (!view) redirect("/today");
  const { city, reason } = view;
  const minShare = LAUNCH.minWomenShare * 100;

  return (
    <div className="w-full max-w-2xl animate-rise">
      <p className="eyebrow">You&apos;re verified · {city.label}</p>
      <h1 className="mt-2 text-4xl font-semibold leading-tight">
        {reason === "city_closed" ? `${city.label} isn't open yet. You're in line.` : "You're on the waitlist, and here's exactly why."}
      </h1>
      <p className="mt-3 text-lg text-ink-2">
        {reason === "city_closed"
          ? `We open a city only once it can give everyone a real pool of people to meet. Opening to an empty room is how dating apps lose people in week one.`
          : `${city.label} is open, but we only let more men who are looking for women in while women stay at ${minShare}% or more. When the balance slips, women get flooded, men get silence, and both leave. Waiting a little keeps it good for you too.`}
      </p>

      <div className="card mt-8 grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="text-center sm:pr-6 sm:border-r sm:border-line">
          <p className="font-display text-6xl font-semibold text-rose">#{view.position}</p>
          <p className="mt-1 text-sm text-muted">{view.ahead === 0 ? "You're next" : `${view.ahead} ${view.ahead === 1 ? "person" : "people"} ahead of you`}</p>
        </div>
        <div className="space-y-4">
          {reason === "city_closed" ? (
            <>
              <Meter label="Verified members" value={city.verified} target={LAUNCH.minVerified} unit="" ok={city.verified >= LAUNCH.minVerified} />
              <Meter label="Women in the pool" value={city.womenShare} target={minShare} unit="%" ok={city.womenShare >= minShare} />
            </>
          ) : (
            <>
              <Meter label={`Women in ${city.label} right now`} value={city.womenShare} target={minShare} unit="%" ok={city.womenShare >= minShare} />
              <p className="text-sm text-ink-2">
                {city.women} women and {city.gatedMen} men looking for women are active, so there&apos;s room for{" "}
                <strong className="text-ink">{city.room} more {city.room === 1 ? "man" : "men"}</strong> right now
                {view.ahead > 0 ? `, offered to the ${view.ahead === 1 ? "person" : "people"} ahead of you first` : ""}. Every woman who joins
                makes room for about one more, and we admit people in order as room opens.
              </p>
            </>
          )}
        </div>
      </div>

      {view.vouchedBy ? (
        <div className="card mt-6 flex items-start gap-3 p-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sage" />
          <p className="text-ink-2">
            <strong className="text-ink">{view.vouchedBy} vouched for you.</strong> You&apos;re at the front of the line and will be in the first
            batch when {city.label} opens.
          </p>
        </div>
      ) : (
        <div className="card mt-6 p-6">
          <h2 className="text-xl font-semibold">Know someone on Pairwise?</h2>
          <p className="mt-1 text-sm text-ink-2">
            Every verified member has three vouch codes. A vouch {reason === "balance" ? "lets you in straight away" : "puts you first in line for launch day"},
            because a real person is putting their name next to yours.
          </p>
          <VouchForm />
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Users, title: "Why we wait", body: `A city opens at ${LAUNCH.minVerified.toLocaleString("en-IN")} verified members. That's about ${Math.round(LAUNCH.minVerified * LAUNCH.compatibleFraction)} compatible people each, or ${Math.floor((LAUNCH.minVerified * LAUNCH.compatibleFraction) / LAUNCH.picksPerDay)} days of picks.` },
          { icon: Scale, title: "Why balance", body: `Below ${minShare}% women, a few profiles get flooded and the rest hear nothing. Both sides churn.` },
          { icon: Hourglass, title: "No queue-jumping", body: "First come, first served. You can't pay to skip the line. A vouch is the only shortcut." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl bg-paper-2/70 p-4">
            <Icon className="h-4 w-4 text-rose" />
            <p className="mt-2 font-semibold">{title}</p>
            <p className="mt-1 text-sm text-ink-2">{body}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-muted">
        While you wait: <Link href="/me/edit" className="underline">polish your profile</Link> ·{" "}
        <Link href="/settings" className="underline">settings, data export and account deletion</Link>
      </p>
    </div>
  );
}
