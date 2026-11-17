import { badRequest, forbidden, notFound } from "../errors";
import { rateLimit } from "../rate-limit";
import { inc, type DocStore, type WriteOp } from "../store/types";
import type { Block, Match, Message, Report, ReportCategory, User } from "../types";
import { pairId } from "./discovery";
import { toCard } from "./profiles";
import { newId } from "./users";

/**
 * Reporting is one tap and always also blocks, so the reporter never has to
 * see that person again while the team reviews. Three open reports from
 * different people hide a profile automatically until a moderator decides
 * (they aren't banned; they're paused pending review).
 *
 * IT Rules 2021: complaints are acknowledged at once (in the UI) and must be
 * resolved within 15 days; intimate-image complaints within 24 hours.
 */

export const REPORT_CATEGORIES: Record<ReportCategory, string> = {
  fake_profile: "Fake profile or impersonation",
  scam_or_money: "Asked for money / scam",
  harassment: "Harassment or abusive messages",
  inappropriate_content: "Sexual or inappropriate content",
  underage: "Might be under 18",
  offline_behaviour: "Something happened when we met",
  other: "Something else",
};

export const AUTO_HIDE_REPORTERS = 3;

export async function blockUser(store: DocStore, viewer: User, target: string, now = Date.now()) {
  if (target === viewer.id) throw badRequest("You can't block yourself.");
  const ops: WriteOp[] = [
    { type: "set", col: "blocks", id: `${viewer.id}__${target}`, data: { id: `${viewer.id}__${target}`, by: viewer.id, target, createdAt: now } satisfies Block },
  ];
  const m = await store.get<Match>("matches", pairId(viewer.id, target));
  if (m && m.status === "active") {
    ops.push({ type: "update", col: "matches", id: m.id, patch: { status: "closed", closedBy: viewer.id, closedAt: now, closeReason: "report" } });
    ops.push({ type: "set", col: "messages", id: `${m.id}_close`, data: { id: `${m.id}_close`, matchId: m.id, from: "system", kind: "system", text: "This conversation has been closed.", createdAt: now } satisfies Message });
  }
  await store.batch(ops);
}

export async function fileReport(
  store: DocStore,
  viewer: User,
  input: { reported: string; matchId?: string; category: ReportCategory; details?: string },
  now = Date.now(),
) {
  if (!REPORT_CATEGORIES[input.category]) throw badRequest("Pick what happened.");
  if (input.reported === viewer.id) throw badRequest("You can't report yourself.");
  const reported = await store.get<User>("users", input.reported);
  if (!reported) throw notFound("That member no longer exists.");
  await rateLimit(store, `report:${viewer.id}`, 10, 24 * 60 * 60 * 1000, now);

  const report: Report = {
    id: newId("r_"),
    reporter: viewer.id,
    reported: input.reported,
    matchId: input.matchId,
    category: input.category,
    details: input.details?.trim().slice(0, 1000),
    status: "open",
    createdAt: now,
  };
  await store.set("reports", report.id, report);
  await store.update("users", input.reported, { "trust.reportsAgainst": inc(1) });
  await blockUser(store, viewer, input.reported, now);

  const open = await store.query<Report>("reports", [
    ["reported", "==", input.reported],
    ["status", "==", "open"],
  ]);
  const distinct = new Set(open.map((r) => r.reporter).filter((r) => r !== "system"));
  if ((distinct.size >= AUTO_HIDE_REPORTERS || input.category === "underage") && reported.status === "active") {
    await store.update("users", input.reported, { status: "under_review" });
  }
  return { id: report.id };
}

// ---- Admin -----------------------------------------------------------------

export function assertAdmin(user: User) {
  if (user.role !== "admin") throw forbidden("Admins only.");
}

export async function listReports(store: DocStore, admin: User) {
  assertAdmin(admin);
  const reports = await store.query<Report>("reports");
  reports.sort((a, b) => (a.status === b.status ? b.createdAt - a.createdAt : a.status === "open" ? -1 : 1));
  const ids = [...new Set(reports.flatMap((r) => [r.reported, r.reporter]).filter((x) => x !== "system"))];
  const users = await store.getMany<User>("users", ids);
  const byId = new Map(users.filter(Boolean).map((u) => [u!.id, u!]));
  return reports.map((r) => {
    const reported = byId.get(r.reported);
    const reporter = byId.get(r.reporter);
    return {
      ...r,
      categoryLabel: REPORT_CATEGORIES[r.category],
      reportedCard: reported?.profile ? toCard(reported, { self: true }) : null,
      reportedEmail: reported?.email,
      reportedStatus: reported?.status,
      reportedTrust: reported?.trust,
      reporterName: r.reporter === "system" ? "Scam Shield (automatic)" : reporter?.profile?.firstName ?? "Deleted member",
    };
  });
}

export async function resolveReport(
  store: DocStore,
  admin: User,
  reportId: string,
  action: "dismissed" | "warned" | "suspended",
  now = Date.now(),
) {
  assertAdmin(admin);
  const report = await store.get<Report>("reports", reportId);
  if (!report) throw notFound();
  const reported = await store.get<User>("users", report.reported);
  const ops: WriteOp[] = [
    { type: "update", col: "reports", id: reportId, patch: { status: "resolved", resolution: action, resolvedBy: admin.id, resolvedAt: now } },
  ];
  if (reported) {
    if (action === "suspended") ops.push({ type: "update", col: "users", id: reported.id, patch: { status: "suspended" } });
    if (action === "warned") ops.push({ type: "update", col: "users", id: reported.id, patch: { "trust.warnings": inc(1), ...(reported.status === "under_review" ? { status: "active" } : {}) } });
    if (action === "dismissed" && reported.status === "under_review") {
      ops.push({ type: "update", col: "users", id: reported.id, patch: { status: "active" } });
    }
  }
  await store.batch(ops);
}
