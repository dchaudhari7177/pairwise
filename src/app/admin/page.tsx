import { AlertTriangle, CheckCircle2, FlaskConical, IndianRupee, MessagesSquare, ShieldAlert, Users } from "lucide-react";
import type { Metadata } from "next";
import { Avatar } from "@/components/Portrait";
import { requireAdmin } from "@/lib/server/viewer";
import { LAUNCH, launchBoard, type CityLaunch } from "@/lib/services/launch";
import { computeMetrics, type Metrics } from "@/lib/services/metrics";
import { listReports } from "@/lib/services/moderation";
import { timeAgo } from "@/lib/time";
import { AdmitButton, ConsoleActions, ResolveButtons } from "./AdminActions";

export const metadata: Metadata = { title: "Founder console" };

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-5">
      <p className="flex items-center gap-2 text-sm text-ink-2">
        <Icon className="h-4 w-4 text-rose" /> {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

function hypothesisStatus(h: Metrics["hypotheses"][number]) {
  if (h.value === null) return { ok: null, text: "Not enough data" };
  if (h.better === "closer") {
    if (h.compare == null) return { ok: null, text: "Not enough data" };
    const gap = Math.abs((h.value ?? 0) - (h.compare ?? 0));
    return { ok: gap <= 24, text: `Gap ${gap.toFixed(0)}h (target ≤ 24h)` };
  }
  if ("target" in h && h.target !== undefined) {
    const ok = h.better === "higher" ? h.value >= h.target : h.value <= h.target;
    return { ok, text: `Target ${h.better === "higher" ? "≥" : "≤"} ${h.target}${h.unit}` };
  }
  if (h.compare !== undefined && h.compare !== null) return { ok: h.value > h.compare, text: `vs ${h.compare}${h.unit} without` };
  return { ok: null, text: "" };
}

const VERDICT_STYLE = {
  running: "bg-paper-2 text-ink-2",
  win: "bg-sage-soft text-sage",
  loss: "bg-rose-soft text-rose-2",
  flat: "bg-amber-soft text-amber",
} as const;

function ArmBar({ label, a }: { label: string; a: Metrics["experiment"]["control"] }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span>
          <strong>{a.rate}%</strong>{" "}
          <span className="text-muted">
            {a.k}/{a.n} chats · 95% CI {a.ci[0]}–{a.ci[1]}%
          </span>
        </span>
      </div>
      {/* The bar is the point estimate; the faint band is the confidence interval. */}
      <div className="relative mt-1.5 h-3 overflow-hidden rounded-full bg-paper-2" role="img" aria-label={`${a.rate}%, confidence interval ${a.ci[0]} to ${a.ci[1]}%`}>
        <div className="absolute inset-y-0 rounded-full bg-rose/20" style={{ left: `${a.ci[0]}%`, width: `${Math.max(0.5, a.ci[1] - a.ci[0])}%` }} />
        <div className="absolute inset-y-0 left-0 rounded-full bg-rose" style={{ width: `${a.rate}%` }} />
      </div>
      <p className="mt-1 text-xs text-muted">{a.sparkPlayed} of {a.n} played a Spark</p>
    </div>
  );
}

function ExperimentCard({ e }: { e: Metrics["experiment"] }) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" /> Live experiment · {e.hypothesis}
          </p>
          <h2 className="mt-1 text-xl font-semibold">{e.title}</h2>
          <p className="mt-1 text-sm text-ink-2">{e.question}</p>
        </div>
        <span className="shrink-0 rounded-full bg-paper-2 px-2.5 py-1 font-mono text-xs text-ink-2">{e.salt}</span>
      </div>
      <p className="mt-3 text-xs text-muted">
        Randomised per match ({e.split * 100}/{100 - e.split * 100}) by a stable hash of the match id. Metric: {e.metric.toLowerCase()}, read {e.readAfterHours}h
        after the match. Intent-to-treat: every match counts in its arm, whether or not they played.
      </p>
      <div className="mt-5 space-y-4">
        <ArmBar label="Control: no suggestion" a={e.control} />
        <ArmBar label="Treatment: Spark nudge" a={e.treatment} />
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-2xl bg-paper-2 p-3">
          <dt className="text-xs text-muted">Lift</dt>
          <dd className="font-semibold">{e.liftPoints > 0 ? "+" : ""}{e.liftPoints} pts</dd>
        </div>
        <div className="rounded-2xl bg-paper-2 p-3">
          <dt className="text-xs text-muted">p-value</dt>
          <dd className="font-semibold">{e.p ?? "—"}</dd>
        </div>
        <div className="rounded-2xl bg-paper-2 p-3">
          <dt className="text-xs text-muted">Needed per arm</dt>
          <dd className="font-semibold">{e.needPerArm}</dd>
        </div>
      </dl>
      <p className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${VERDICT_STYLE[e.verdict.status]}`}>{e.verdict.text}</p>
    </div>
  );
}

function CityLaunchCard({ board }: { board: CityLaunch[] }) {
  const minShare = LAUNCH.minWomenShare * 100;
  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold">City launch control</h2>
      <p className="mt-1 text-sm text-ink-2">
        A city opens at {LAUNCH.minVerified.toLocaleString("en-IN")} verified members (about {Math.round(LAUNCH.minVerified * LAUNCH.compatibleFraction)} compatible
        people each). In open cities, men seeking women are let in from the waitlist only while women stay at {minShare}% or more.
      </p>
      <div className="mt-5 space-y-4">
        {board.map((c) => (
          <div key={c.city} className="rounded-2xl border border-line p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-medium">
                {c.label}
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.open ? "bg-sage-soft text-sage" : "bg-paper-2 text-ink-2"}`}>
                  {c.open ? "Open" : c.ready ? "Ready to open" : `${c.progress}% to launch`}
                </span>
              </span>
              <span className={c.womenShare >= minShare ? "text-sage" : "text-amber"}>
                {c.womenShare}% women · {c.open ? `${c.active} active` : `${c.verified} verified`}
              </span>
            </div>
            <div className="relative mt-2 h-2.5 overflow-hidden rounded-full bg-paper-2" role="img" aria-label={`${c.womenShare}% women; threshold ${minShare}%`}>
              <div className="h-full rounded-full bg-sage" style={{ width: `${c.womenShare}%` }} />
              <span className="absolute inset-y-0 w-0.5 bg-ink/40" style={{ left: `${minShare}%` }} title={`${minShare}% threshold`} />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span>
                Waitlist: {c.waitlist.total}
                {c.waitlist.total > 0 && ` (${c.waitlist.women} women, ${c.waitlist.men} men${c.waitlist.vouched ? `, ${c.waitlist.vouched} vouched` : ""})`}
                {c.open && ` · pool ≈ ${c.pool} each · ${c.daysOfPicks} days of picks`}
              </span>
              {c.open && c.waitlist.total > 0 && <AdmitButton city={c.city} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CohortTable({ cohorts }: { cohorts: Metrics["cohorts"] }) {
  const weeks = cohorts[0]?.weeks.length ?? 5;
  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold">Retention by sign-up week</h2>
      <p className="mt-1 text-sm text-ink-2">
        Share of each week&apos;s new members who liked, passed or messaged in week <em>n</em> after joining. A healthy slow-dating app keeps a steady
        weekly habit rather than a daily one.
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted">
              <th className="py-2 pr-3 text-left font-medium">Cohort</th>
              <th className="py-2 pr-3 text-right font-medium">Size</th>
              {Array.from({ length: weeks }, (_, k) => (
                <th key={k} className="px-1 py-2 text-center font-medium">
                  W{k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((c) => (
              <tr key={c.start}>
                <td className="whitespace-nowrap py-1 pr-3 text-ink-2">{c.label}</td>
                <td className="py-1 pr-3 text-right font-semibold">{c.size}</td>
                {c.weeks.map((w, k) => (
                  <td key={k} className="px-1 py-1">
                    {w ? (
                      <span
                        className="block rounded-lg py-1.5 text-center text-xs font-semibold"
                        style={{ background: `color-mix(in oklab, var(--color-rose) ${Math.round(w.rate * 0.85)}%, var(--color-paper-2))`, color: w.rate > 55 ? "white" : undefined }}
                        title={`${w.active} of ${w.eligible} active`}
                      >
                        {Math.round(w.rate)}%
                      </span>
                    ) : (
                      <span className="block py-1.5 text-center text-xs text-muted">·</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cohorts.length === 0 && <p className="mt-4 text-center text-sm text-muted">No cohorts yet.</p>}
    </div>
  );
}

export default async function AdminPage() {
  const { store, user } = await requireAdmin();
  const [m, reports, board] = await Promise.all([computeMetrics(store, user), listReports(store, user), launchBoard(store)]);
  const open = reports.filter((r) => r.status === "open");
  const resolved = reports.filter((r) => r.status === "resolved").slice(0, 5);
  const maxFunnel = Math.max(1, m.funnel[0].value);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Pilot · Bengaluru, Pune, Hyderabad</p>
          <h1 className="mt-1 text-4xl font-semibold">Is Pairwise working?</h1>
          <p className="mt-2 max-w-2xl text-ink-2">
            Every number here maps to a hypothesis in the product thesis. We optimise for meaningful conversations and safe dates,
            not time in the app.
          </p>
        </div>
        <ConsoleActions />
      </div>

      {/* North star */}
      <section className="grid gap-4 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="rounded-3xl bg-plum p-6 text-paper">
          <p className="eyebrow text-paper/60">North-star metric</p>
          <p className="mt-2 font-display text-5xl font-semibold">{m.northStar.wmc}</p>
          <p className="mt-1 font-semibold">Weekly Meaningful Conversations</p>
          <p className="mt-2 text-sm text-paper/70">Matches where both people sent 8+ messages in the last 7 days. {m.northStar.meaningfulAllTime} all-time.</p>
        </div>
        <Stat icon={Users} label="Verified members" value={m.totals.verified} sub={`${m.totals.verifiedShare}% of sign-ups verified`} />
        <Stat icon={MessagesSquare} label="Active conversations" value={m.totals.activeConversations} sub={`${m.totals.matches} matches · ${m.totals.likeToMatch}% of likes become matches`} />
        <Stat icon={IndianRupee} label="MRR (Plus)" value={`₹${m.revenue.mrr.toLocaleString("en-IN")}`} sub={`${m.revenue.plusMembers} members · ${m.revenue.plusShare}% conversion · ₹${m.revenue.revenue30.toLocaleString("en-IN")} last 30d`} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {/* Funnel */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Funnel: verified member → planned date</h2>
          <div className="mt-5 space-y-3">
            {m.funnel.map((f, i) => (
              <div key={f.label}>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-2">{f.label}</span>
                  <span className="font-semibold">
                    {f.value}
                    {i > 0 && <span className="ml-1.5 font-normal text-muted">{Math.round((f.value / maxFunnel) * 100)}%</span>}
                  </span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-paper-2">
                  <div className="h-full rounded-full bg-rose" style={{ width: `${(f.value / maxFunnel) * 100}%`, opacity: 1 - i * 0.09 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <CityLaunchCard board={board} />
      </section>

      {/* Hypotheses */}
      <section className="card overflow-hidden">
        <div className="p-6 pb-3">
          <h2 className="text-xl font-semibold">Hypotheses we&apos;re testing</h2>
          <p className="mt-1 text-sm text-ink-2">From the product thesis. Pilot data is small, so these are directional, not conclusive.</p>
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-line">
            {m.hypotheses.map((h) => {
              const s = hypothesisStatus(h);
              return (
                <tr key={h.id}>
                  <td className="w-14 px-6 py-3 font-display text-lg font-semibold text-rose">{h.id}</td>
                  <td className="py-3 pr-4 text-ink-2">{h.label}</td>
                  <td className="whitespace-nowrap py-3 pr-4 font-semibold">
                    {h.value ?? "—"}
                    {h.value !== null && h.unit}
                    {h.compare !== undefined && (
                      <span className="font-normal text-muted">
                        {" "}vs {h.compare ?? "—"}
                        {h.compare !== null && h.unit}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-6 text-right">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${s.ok === null ? "bg-paper-2 text-muted" : s.ok ? "bg-sage-soft text-sage" : "bg-amber-soft text-amber"}`}>
                      {s.ok ? <CheckCircle2 className="h-3 w-3" /> : s.ok === false ? <AlertTriangle className="h-3 w-3" /> : null}
                      {s.text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <ExperimentCard e={m.experiment} />
        <CohortTable cohorts={m.cohorts} />
      </section>

      {/* Moderation */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Moderation queue</h2>
            <p className="mt-1 text-sm text-ink-2">
              IT Rules 2021: acknowledge immediately, resolve within 15 days (24h for intimate-image complaints). Median resolution:{" "}
              {m.safety.medianResolutionHours !== null ? `${m.safety.medianResolutionHours.toFixed(1)}h` : "—"}.
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="rounded-full bg-rose-soft px-3 py-1 font-semibold text-rose-2">{m.safety.openReports} open</span>
            <span className="rounded-full bg-amber-soft px-3 py-1 font-semibold text-amber">{m.safety.flaggedMessages} Scam Shield flags</span>
            <span className="rounded-full bg-paper-2 px-3 py-1 font-semibold text-ink-2">{m.safety.suspended} suspended</span>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {open.length === 0 && <p className="card p-6 text-center text-ink-2">Queue is clear. 🎉</p>}
          {open.map((r) => (
            <div key={r.id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
              {r.reportedCard && <Avatar seed={r.reportedCard.avatarSeed} gender={r.reportedCard.gender} name={r.reportedCard.firstName} size={52} />}
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{r.reportedCard?.firstName ?? r.reported}</span>
                  <span className="text-xs text-muted">{r.reportedEmail}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.reportedStatus === "under_review" ? "bg-amber-soft text-amber" : "bg-paper-2 text-ink-2"}`}>{r.reportedStatus}</span>
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-rose-2">
                  <ShieldAlert className="h-4 w-4" /> {r.categoryLabel}
                </p>
                {r.details && <p className="mt-1 text-sm text-ink-2">“{r.details}”</p>}
                <p className="mt-2 text-xs text-muted">
                  Reported by {r.reporterName} · {timeAgo(r.createdAt)} · {r.reportedTrust?.scamFlags ?? 0} scam flags · {r.reportedTrust?.reportsAgainst ?? 0} reports ·{" "}
                  {r.reportedTrust?.warnings ?? 0} warnings
                </p>
              </div>
              <ResolveButtons reportId={r.id} />
            </div>
          ))}
        </div>
        {resolved.length > 0 && (
          <div className="mt-6">
            <p className="eyebrow mb-2">Recently resolved</p>
            <ul className="space-y-1 text-sm text-ink-2">
              {resolved.map((r) => (
                <li key={r.id}>
                  {r.reportedCard?.firstName ?? r.reported}: {r.categoryLabel} → <strong>{r.resolution}</strong> {r.resolvedAt ? timeAgo(r.resolvedAt) : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
