// The go / iterate / stop decision before opening the next city.
//
// Opening a city is a capital decision: the unit-economics model says a new
// city loses money until it has a few thousand verified members. So we write
// down in advance what has to be true before we spend on the next one, and
// what would make us stop. Writing the kill criteria before seeing the data is
// the point: it stops us moving the goalposts once we're attached to the idea.
//
// Pure function; the founder console feeds it live metrics.

import { LAUNCH } from "./services/launch";

export type GateStatus = "pass" | "fail" | "pending";

export type GateCheck = {
  id: string;
  label: string;
  /** Current reading, already formatted, or null with too little data. */
  reading: string | null;
  target: string;
  status: GateStatus;
  /** What we'd change if this one fails. */
  lever: string;
};

export type GateVerdict = "go" | "iterate" | "stop" | "too_early";

export type GateInput = {
  /** Active members in the biggest open city. */
  largestCityActive: number;
  /** Women's share of the market in open cities, %. */
  womenShare: number | null;
  /** H2: picks that get a decision, %. */
  pickDecisionRate: number | null;
  /** H3: ghost rate, %. */
  ghostRate: number | null;
  /** H6: conversations that reach a date plan, %. */
  dateRate: number | null;
  /** Share of members active in their 4th week after joining, %. */
  week4Retention: number | null;
  /** Partner venues paying a listing fee. */
  payingVenues: number;
};

/** Thresholds written down before the pilot. Kill lines are deliberately far below the targets. */
export const GATE = {
  minActive: LAUNCH.minVerified,
  womenShare: { target: LAUNCH.minWomenShare * 100, kill: 30 },
  pickDecisionRate: { target: 40 },
  ghostRate: { target: 25, kill: 50 },
  dateRate: { target: 15, kill: 5 },
  week4Retention: { target: 25, kill: 10 },
  payingVenues: { target: 10 },
} as const;

const at = (v: number | null, ok: (v: number) => boolean): GateStatus => (v === null ? "pending" : ok(v) ? "pass" : "fail");
const pct = (v: number | null) => (v === null ? null : `${Math.round(v)}%`);

export function nextCityGate(i: GateInput): { verdict: GateVerdict; headline: string; checks: GateCheck[]; kills: string[] } {
  const checks: GateCheck[] = [
    {
      id: "liquidity",
      label: "Pilot city has reached launch size",
      reading: i.largestCityActive.toLocaleString("en-IN"),
      target: `≥ ${GATE.minActive.toLocaleString("en-IN")} active`,
      status: i.largestCityActive >= GATE.minActive ? "pass" : "pending",
      lever: "Below this the other readings are noise. Keep inviting from the waitlist.",
    },
    {
      id: "balance",
      label: "Women's share holds without throttling",
      reading: pct(i.womenShare),
      target: `≥ ${GATE.womenShare.target}%`,
      status: at(i.womenShare, (v) => v >= GATE.womenShare.target),
      lever: "Slow men's admissions; run women-first invitation waves.",
    },
    {
      id: "H2",
      label: "Picks get a decision (H2)",
      reading: pct(i.pickDecisionRate),
      target: `≥ ${GATE.pickDecisionRate.target}%`,
      status: at(i.pickDecisionRate, (v) => v >= GATE.pickDecisionRate.target),
      lever: "Better reasons on each pick; test 4 vs 6 picks a day.",
    },
    {
      id: "H3",
      label: "Ghost rate stays low (H3)",
      reading: pct(i.ghostRate),
      target: `≤ ${GATE.ghostRate.target}%`,
      status: at(i.ghostRate, (v) => v <= GATE.ghostRate.target),
      lever: "Shorter expiry, earlier your-turn nudges, fewer slots.",
    },
    {
      id: "H6",
      label: "Conversations reach a date (H6)",
      reading: pct(i.dateRate),
      target: `≥ ${GATE.dateRate.target}%`,
      status: at(i.dateRate, (v) => v >= GATE.dateRate.target),
      lever: "Suggest Date Plan earlier; more partner venues near members.",
    },
    {
      id: "retention",
      label: "Members still active in week 4",
      reading: pct(i.week4Retention),
      target: `≥ ${GATE.week4Retention.target}%`,
      status: at(i.week4Retention, (v) => v >= GATE.week4Retention.target),
      lever: "Look at who leaves and why before adding anything new.",
    },
    {
      id: "venues",
      label: "Venues pay, not just list free",
      reading: String(i.payingVenues),
      target: `≥ ${GATE.payingVenues.target} paying`,
      status: i.payingVenues >= GATE.payingVenues.target ? "pass" : "fail",
      lever: "If venues won't pay after a free month, the revenue model leans on Plus. Rethink before scaling.",
    },
  ];

  // Kill lines only count once the sample is big enough to trust.
  const enough = i.largestCityActive >= GATE.minActive;
  const kills: string[] = [];
  if (i.womenShare !== null && i.womenShare < GATE.womenShare.kill) kills.push(`Women's share below ${GATE.womenShare.kill}% even with the waitlist`);
  if (i.dateRate !== null && i.dateRate < GATE.dateRate.kill) kills.push(`Fewer than ${GATE.dateRate.kill}% of conversations reach a date`);
  if (i.week4Retention !== null && i.week4Retention < GATE.week4Retention.kill) kills.push(`Under ${GATE.week4Retention.kill}% of members still active in week 4`);
  if (i.ghostRate !== null && i.ghostRate > GATE.ghostRate.kill) kills.push(`More than ${GATE.ghostRate.kill}% of chats ghosted despite slots and expiry`);

  const failing = checks.filter((c) => c.status === "fail").length;
  const pending = checks.filter((c) => c.status === "pending").length;

  if (!enough) {
    return {
      verdict: "too_early",
      headline: `Too early to decide. The pilot city has ${i.largestCityActive.toLocaleString("en-IN")} active members, and the gate needs ${GATE.minActive.toLocaleString("en-IN")} before any reading is trusted. The readings below are directional.`,
      checks,
      kills,
    };
  }
  if (kills.length) {
    return {
      verdict: "stop",
      headline: "Stop scaling. A kill line is crossed: don't open another city. Fix the cause in the pilot, or test the \"new in the city\" friends pivot on the same verified base.",
      checks,
      kills,
    };
  }
  if (failing === 0 && pending === 0) {
    return { verdict: "go", headline: "Go. Every criterion holds at a trustworthy sample size: open the next city from its waitlist.", checks, kills };
  }
  return {
    verdict: "iterate",
    headline: `Iterate. ${failing + pending} of ${checks.length} criteria don't hold yet. Pull each one's lever in the pilot city before spending on a new one.`,
    checks,
    kills,
  };
}

/** Weighted week-n retention across cohorts that have reached week n. */
export function weekRetention(cohorts: { weeks: ({ active: number; eligible: number } | null)[] }[], week: number): number | null {
  let active = 0;
  let eligible = 0;
  for (const c of cohorts) {
    const w = c.weeks[week];
    if (!w) continue;
    active += w.active;
    eligible += w.eligible;
  }
  return eligible ? (active / eligible) * 100 : null;
}
