import { CITIES, PRICES } from "../options";
import type { DocStore } from "../store/types";
import { DAY, HOUR } from "../time";
import type { CityId, Like, Match, Message, Pass, Payment, PicksDoc, Report, User } from "../types";
import { assertAdmin } from "./moderation";

/**
 * The founder's dashboard. These are the numbers that tell us whether
 * Pairwise is working, chosen to match the hypotheses in docs/PRODUCT.md.
 * Computed by scanning collections, which is fine at pilot scale. At scale
 * these would be incremental counters or a nightly BigQuery export.
 */

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0);

export async function computeMetrics(store: DocStore, admin: User, now = Date.now()) {
  assertAdmin(admin);
  const [users, likes, passes, matches, messages, reports, payments, picks] = await Promise.all([
    store.query<User>("users"),
    store.query<Like>("likes"),
    store.query<Pass>("passes"),
    store.query<Match>("matches"),
    store.query<Message>("messages"),
    store.query<Report>("reports"),
    store.query<Payment>("payments"),
    store.query<PicksDoc>("picks"),
  ]);
  const members = users.filter((u) => u.role === "member");
  const verified = members.filter((u) => u.verification.identity);
  const onboarded = verified.filter((u) => u.onboarded && u.profile);

  // ---- Gender balance by city (the health of a two-sided market) ----------
  const cities = (Object.keys(CITIES) as CityId[])
    .filter((c) => CITIES[c].open)
    .map((city) => {
      const inCity = onboarded.filter((u) => u.profile!.city === city);
      const women = inCity.filter((u) => u.profile!.gender === "woman").length;
      return { city, label: CITIES[city].label, members: inCity.length, women, womenShare: pct(women, inCity.length) };
    });

  // ---- North star: Weekly Meaningful Conversations ---------------------------
  const weekAgo = now - 7 * DAY;
  const byMatch = new Map<string, Message[]>();
  for (const m of messages) {
    if (m.from === "system") continue;
    const arr = byMatch.get(m.matchId) ?? [];
    arr.push(m);
    byMatch.set(m.matchId, arr);
  }
  const countsFor = (match: Match, since = 0) => {
    const msgs = (byMatch.get(match.id) ?? []).filter((x) => x.createdAt >= since);
    return match.members.map((uid) => msgs.filter((x) => x.from === uid).length);
  };
  const wmc = matches.filter((m) => countsFor(m, weekAgo).every((n) => n >= 8)).length;
  const meaningful = matches.filter((m) => countsFor(m).every((n) => n >= 8));
  const conversations = matches.filter((m) => countsFor(m).every((n) => n >= 1));
  const datesPlanned = matches.filter((m) => m.datePlan?.status === "accepted");

  // ---- Funnel ----------------------------------------------------------------
  const liked = new Set([...likes.map((l) => l.from), ...likes.map((l) => l.to)]);
  const matchedUsers = new Set(matches.flatMap((m) => m.members));
  const funnel = [
    { label: "Verified members", value: verified.length },
    { label: "Profile complete", value: onboarded.length },
    { label: "Sent or got a like", value: onboarded.filter((u) => liked.has(u.id)).length },
    { label: "Matched", value: onboarded.filter((u) => matchedUsers.has(u.id)).length },
    { label: "In a two-way conversation", value: new Set(conversations.flatMap((m) => m.members)).size },
    { label: "Meaningful conversation (8+ each)", value: new Set(meaningful.flatMap((m) => m.members)).size },
    { label: "Planned a date", value: new Set(datesPlanned.flatMap((m) => m.members)).size },
  ];

  // ---- Hypotheses ------------------------------------------------------------
  // H2: share of picks that got a decision (like or pass), over the last 7 days.
  const recentPicks = picks.filter((p) => p.createdAt >= weekAgo);
  const actedPairs = new Set([...likes.map((l) => `${l.from}>${l.to}`), ...passes.map((p) => `${p.from}>${p.to}`)]);
  const shown = recentPicks.reduce((n, p) => n + p.picks.length, 0);
  const decided = recentPicks.reduce((n, p) => n + p.picks.filter((x) => actedPairs.has(`${p.uid}>${x.uid}`)).length, 0);

  // H3: ghost rate = matches older than 72h where one side never replied.
  const old = matches.filter((m) => now - m.createdAt > 72 * HOUR);
  const ghosted = old.filter((m) => countsFor(m).some((n) => n === 0));

  // H4: do matches that play Spark go deeper?
  const withSpark = matches.filter((m) => m.spark);
  const withoutSpark = matches.filter((m) => !m.spark);
  const deep = (ms: Match[]) => ms.filter((m) => countsFor(m).reduce((a, b) => a + b, 0) >= 10).length;

  // H5: median hours from sign-up to first match, by gender.
  const firstMatch = new Map<string, number>();
  for (const m of matches) for (const uid of m.members) firstMatch.set(uid, Math.min(firstMatch.get(uid) ?? Infinity, m.createdAt));
  const ttfm = (g: string) =>
    median(onboarded.filter((u) => u.profile!.gender === g && firstMatch.has(u.id)).map((u) => Math.max(0, (firstMatch.get(u.id)! - u.createdAt) / HOUR)));

  // H6: share of two-way conversations that reach a planned date.
  const hypotheses = [
    { id: "H2", label: "Picks that get a decision", value: pct(decided, shown), unit: "%", target: 40, better: "higher" as const },
    { id: "H3", label: "Ghost rate (no reply in 72h)", value: pct(ghosted.length, old.length), unit: "%", target: 25, better: "lower" as const },
    { id: "H4", label: "10+ message chats: with Spark vs without", value: pct(deep(withSpark), withSpark.length), compare: pct(deep(withoutSpark), withoutSpark.length), unit: "%", better: "higher" as const },
    { id: "H5", label: "Hours to first match: women vs men", value: ttfm("woman"), compare: ttfm("man"), unit: "h", better: "closer" as const },
    { id: "H6", label: "Conversations that reach a date", value: pct(datesPlanned.length, conversations.length), unit: "%", target: 15, better: "higher" as const },
  ];

  // ---- Revenue -----------------------------------------------------------------
  const plus = members.filter((u) => u.plan === "plus");
  const lastPlanFor = (uid: string) => payments.filter((p) => p.uid === uid).sort((a, b) => b.createdAt - a.createdAt)[0]?.plan;
  const mrr = plus.reduce((sum, u) => {
    const plan = lastPlanFor(u.id) ?? "plus_monthly";
    return sum + (plan === "plus_quarterly" ? PRICES.plus_quarterly.inr / 3 : PRICES.plus_monthly.inr);
  }, 0);
  const revenue30 = payments.filter((p) => p.createdAt >= now - 30 * DAY).reduce((s, p) => s + p.amountInr, 0);

  // ---- Safety --------------------------------------------------------------------
  const openReports = reports.filter((r) => r.status === "open");
  const resolved = reports.filter((r) => r.status === "resolved" && r.resolvedAt);
  const flaggedMessages = messages.filter((m) => m.signals?.some((s) => s === "money" || s === "crypto" || s === "upi")).length;

  return {
    generatedAt: now,
    totals: {
      members: members.length,
      verified: verified.length,
      verifiedShare: pct(verified.length, members.length),
      onboarded: onboarded.length,
      likes: likes.length,
      matches: matches.length,
      likeToMatch: pct(matches.length * 2, likes.length),
      activeConversations: matches.filter((m) => m.status === "active").length,
    },
    northStar: { wmc, meaningfulAllTime: meaningful.length },
    cities,
    funnel,
    hypotheses,
    revenue: { plusMembers: plus.length, plusShare: pct(plus.length, onboarded.length), mrr: Math.round(mrr), revenue30, arpu: onboarded.length ? Math.round((mrr / onboarded.length) * 10) / 10 : 0 },
    safety: {
      openReports: openReports.length,
      resolvedReports: resolved.length,
      medianResolutionHours: median(resolved.map((r) => (r.resolvedAt! - r.createdAt) / HOUR)),
      flaggedMessages,
      suspended: members.filter((u) => u.status === "suspended").length,
      underReview: members.filter((u) => u.status === "under_review").length,
    },
  };
}

export type Metrics = Awaited<ReturnType<typeof computeMetrics>>;
