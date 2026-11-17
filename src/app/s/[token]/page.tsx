import { BadgeCheck, Clock, MapPin, PhoneCall, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { Portrait } from "@/components/Portrait";
import { readShareLink } from "@/lib/services/dates";
import { getStore } from "@/lib/store";
import { formatIst } from "@/lib/time";

export const metadata: Metadata = { title: "Shared date plan", robots: { index: false, follow: false } };

export default async function SharedPlan({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let plan: Awaited<ReturnType<typeof readShareLink>> | null = null;
  try {
    plan = await readShareLink(await getStore(), token);
  } catch {
    plan = null;
  }

  return (
    <div className="grain flex min-h-dvh flex-col items-center px-4 py-10">
      <Logo />
      {!plan ? (
        <div className="card mt-10 w-full max-w-md p-8 text-center">
          <Clock className="mx-auto h-8 w-8 text-muted" />
          <h1 className="mt-3 text-2xl font-semibold">This link has expired</h1>
          <p className="mt-2 text-ink-2">Shared date plans stop working a day after the date, to protect everyone&apos;s privacy.</p>
        </div>
      ) : (
        <div className="mt-8 w-full max-w-md animate-rise">
          <div className="card overflow-hidden">
            <div className="bg-plum px-6 py-5 text-paper">
              <p className="eyebrow text-paper/60">Shared with you by {plan.sharer}</p>
              <h1 className="mt-1 text-2xl font-semibold">{plan.sharer} has a date. Here&apos;s the plan.</h1>
            </div>
            <div className="space-y-5 p-6">
              {plan.cancelled && <p className="rounded-xl bg-amber-soft px-3 py-2 text-sm text-amber">This conversation has since been closed, so the plan may be off.</p>}
              <div className="flex items-center gap-4">
                <Portrait seed={plan.with.avatarSeed} name={plan.with.firstName} className="h-20 w-16" rounded="rounded-2xl" showInitial={false} />
                <div>
                  <p className="flex items-center gap-1.5 font-display text-xl font-semibold">
                    {plan.with.firstName} {plan.with.verified && <BadgeCheck className="h-5 w-5 text-sage" />}
                  </p>
                  <p className="text-sm text-ink-2">
                    {plan.with.role}
                    {plan.with.employer ? ` at ${plan.with.employer}` : ""}
                  </p>
                  {plan.with.verified && (
                    <p className="text-xs text-sage">Identity verified via {plan.with.via === "elitmus" ? "eLitmus" : "work email"}</p>
                  )}
                </div>
              </div>
              <div className="rounded-2xl bg-paper-2/70 p-4">
                <p className="flex items-center gap-2 font-semibold">
                  <MapPin className="h-4 w-4 text-rose" /> {plan.venue.name}
                </p>
                <p className="mt-0.5 text-sm text-ink-2">
                  {plan.venue.kind}, {plan.venue.area} · {plan.venue.why}
                </p>
                <p className="mt-3 flex items-center gap-2 font-semibold">
                  <Clock className="h-4 w-4 text-rose" /> {formatIst(plan.at)}
                </p>
              </div>
              <div className="text-sm text-ink-2">
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <ShieldCheck className="h-4 w-4 text-sage" /> What you can do
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Check in with {plan.sharer} around the start time and again after.</li>
                  <li>If you can&apos;t reach them and you&apos;re worried, call them first, then the venue.</li>
                </ul>
              </div>
              <p className="flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm">
                <PhoneCall className="h-4 w-4 text-rose" /> Emergency: <strong>112</strong> · Women&apos;s helpline: <strong>181</strong>
              </p>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-muted">
            This private link expires {formatIst(plan.expiresAt)}. It contains no phone numbers or contact details.
          </p>
        </div>
      )}
    </div>
  );
}
