"use client";

import { CalendarHeart, Check, Copy, Gift, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/client/api";
import type { Conversation } from "@/lib/services/matches";
import { formatIst } from "@/lib/time";
import type { Venue } from "@/lib/venues";

function defaultTime() {
  // Next Saturday, 5 PM local time, as a datetime-local string.
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  d.setHours(17, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T17:00`;
}

export function MeetPanel({ convo, venues, onChange }: { convo: Conversation; venues: Venue[]; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const [when, setWhen] = useState(defaultTime());
  const [share, setShare] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [safe, setSafe] = useState<boolean | null>(null);
  const [again, setAgain] = useState<"yes" | "maybe" | "no">("maybe");
  const [details, setDetails] = useState("");
  const name = convo.other.firstName;
  const plan = convo.datePlan;
  const active = convo.match.status === "active";

  async function act(key: string, path: string, body: unknown) {
    setBusy(key);
    setError(null);
    try {
      const r = await api<{ url?: string }>(path, { body });
      if (r.url) setShare(r.url);
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
  }

  const bothReady = convo.meetReady.me && convo.meetReady.them;
  const [now] = useState(() => Date.now());
  const past = plan?.status === "accepted" && plan.at < now;

  return (
    <div className="space-y-4">
      {/* 1. Consent first */}
      <div className="card p-5">
        <p className="eyebrow">Step 1 · Consent first</p>
        <h3 className="mt-2 text-xl font-semibold">Would you like to meet {name}?</h3>
        <p className="mt-1 text-sm text-ink-2">
          Nobody can propose a date until you both say yes. {name} only sees that you&apos;re ready once they&apos;re ready too, so
          there&apos;s no pressure and no awkward &ldquo;no&rdquo;.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            className={`btn ${convo.meetReady.me ? "btn-ghost" : "btn-primary"}`}
            disabled={!active || busy === "ready"}
            onClick={() => act("ready", `/api/matches/${convo.match.id}/meet`, { ready: !convo.meetReady.me })}
          >
            {busy === "ready" ? <Loader2 className="h-4 w-4 animate-spin" /> : convo.meetReady.me ? <Check className="h-4 w-4 text-sage" /> : null}
            {convo.meetReady.me ? "You'd like to meet (tap to undo)" : "I'd like to meet"}
          </button>
          {bothReady && <span className="rounded-full bg-sage-soft px-3 py-1 text-sm font-semibold text-sage">You&apos;re both ready 🤝</span>}
        </div>
      </div>

      {/* 2. Plan */}
      {bothReady && (!plan || plan.status === "declined") && (
        <div className="card p-5">
          <p className="eyebrow">Step 2 · Pick a public place</p>
          {plan?.status === "declined" && <p className="mt-2 text-sm text-ink-2">The last suggestion didn&apos;t work out. Try another time or place.</p>}
          <div className="mt-3 grid gap-2">
            {venues.map((v) => (
              <label key={v.id} className={`flex cursor-pointer gap-3 rounded-2xl border p-3 transition ${venueId === v.id ? "border-ink bg-paper-2" : "border-line-2 hover:border-ink-2"}`}>
                <input type="radio" name="venue" className="mt-1 accent-[var(--rose)]" checked={venueId === v.id} onChange={() => setVenueId(v.id)} />
                <span className="min-w-0">
                  <span className="block font-semibold">
                    {v.name} <span className="font-normal text-muted">· {v.kind}, {v.area}</span>
                  </span>
                  <span className="block text-sm text-ink-2">{v.why}</span>
                  {v.partner && v.perk && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-soft px-2 py-0.5 text-xs font-semibold text-amber">
                      <Gift className="h-3 w-3" /> Partner perk: {v.perk}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
          <label className="mt-4 block">
            <span className="label">When</span>
            <input className="input" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
            <span className="mt-1 block text-xs text-muted">First dates: between 7 AM and 10 PM, in a public place.</span>
          </label>
          <button
            className="btn btn-love mt-4"
            disabled={!!busy}
            onClick={() => act("propose", `/api/matches/${convo.match.id}/date`, { venueId, at: new Date(when).getTime() })}
          >
            {busy === "propose" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarHeart className="h-4 w-4" />} Suggest this to {name}
          </button>
        </div>
      )}

      {plan && plan.status !== "declined" && (
        <div className="card overflow-hidden">
          <div className={`px-5 py-3 text-sm font-semibold ${plan.status === "accepted" ? "bg-sage-soft text-sage" : "bg-amber-soft text-amber"}`}>
            {plan.status === "accepted" ? (past ? "You met! How did it go?" : "It's a date ✅") : plan.proposedByMe ? `Waiting for ${name} to respond` : `${name} suggested a plan`}
          </div>
          <div className="p-5">
            <p className="flex items-center gap-2 font-display text-xl font-semibold">
              <MapPin className="h-5 w-5 text-rose" /> {plan.venue?.name}
            </p>
            <p className="mt-1 text-ink-2">
              {plan.venue?.kind}, {plan.venue?.area} · {formatIst(plan.at)}
            </p>
            {plan.venue?.perk && <p className="mt-2 text-sm text-amber">🎁 {plan.venue.perk}</p>}
            {plan.status === "accepted" && plan.perkCode && !past && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-rose/40 bg-rose-soft/40 px-4 py-3">
                <div>
                  <p className="text-xs text-ink-2">Show this at the counter on the day</p>
                  <p className="font-mono text-lg font-semibold tracking-widest text-rose-2">{plan.perkCode}</p>
                </div>
                <p className="max-w-[9rem] text-right text-[11px] leading-tight text-muted">Free for you. The venue pays us, not you.</p>
              </div>
            )}

            {plan.status === "proposed" && !plan.proposedByMe && (
              <div className="mt-4 flex gap-3">
                <button className="btn btn-ghost flex-1" disabled={!!busy} onClick={() => act("decline", `/api/matches/${convo.match.id}/date/respond`, { accept: false })}>
                  Can&apos;t make it
                </button>
                <button className="btn btn-love flex-1" disabled={!!busy} onClick={() => act("accept", `/api/matches/${convo.match.id}/date/respond`, { accept: true })}>
                  {busy === "accept" && <Loader2 className="h-4 w-4 animate-spin" />} Accept
                </button>
              </div>
            )}

            {plan.status === "accepted" && !past && (
              <div className="mt-5 rounded-2xl bg-paper-2/70 p-4">
                <p className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-sage" /> Share the plan with a friend
                </p>
                <p className="mt-1 text-sm text-ink-2">
                  A private link showing who, where and when, with no phone numbers. It expires a day after the date.
                </p>
                {share ? (
                  <div className="mt-3 flex gap-2">
                    <input className="input font-mono text-xs" readOnly value={share} onFocus={(e) => e.target.select()} />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(share);
                        setCopied(true);
                      }}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-ghost btn-sm mt-3" disabled={!!busy} onClick={() => act("share", `/api/matches/${convo.match.id}/share`, {})}>
                    {busy === "share" && <Loader2 className="h-4 w-4 animate-spin" />} Create share link
                  </button>
                )}
              </div>
            )}

            {past && !convo.myCheckin && (
              <div className="mt-5 space-y-3 rounded-2xl border border-line p-4">
                <p className="font-semibold">A private check-in. {name} never sees your answers.</p>
                <div>
                  <p className="label">Did you feel safe and respected?</p>
                  <div className="flex gap-2">
                    <button aria-pressed={safe === true} className="toggle-chip" onClick={() => setSafe(true)}>Yes</button>
                    <button aria-pressed={safe === false} className="toggle-chip" onClick={() => setSafe(false)}>No</button>
                  </div>
                </div>
                {safe === false && (
                  <textarea className="input min-h-20" placeholder="What happened? This goes straight to our safety team." value={details} onChange={(e) => setDetails(e.target.value)} />
                )}
                <div>
                  <p className="label">Would you see {name} again?</p>
                  <div className="flex gap-2">
                    {(["yes", "maybe", "no"] as const).map((a) => (
                      <button key={a} aria-pressed={again === a} className="toggle-chip capitalize" onClick={() => setAgain(a)}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="btn btn-primary" disabled={safe === null || !!busy} onClick={() => act("checkin", `/api/matches/${convo.match.id}/checkin`, { safe, again, details: details || undefined })}>
                  Submit check-in
                </button>
              </div>
            )}
            {past && convo.myCheckin && <p className="mt-4 text-sm text-sage">Thanks for checking in. It helps keep Pairwise safe.</p>}
          </div>
        </div>
      )}
      {error && <p className="rounded-2xl bg-rose-soft p-3 text-sm text-rose-2">{error}</p>}
    </div>
  );
}
