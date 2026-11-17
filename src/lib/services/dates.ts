import { randomBytes } from "node:crypto";
import { badRequest, conflict, forbidden, notFound } from "../errors";
import type { DocStore } from "../store/types";
import { DAY, formatIst, HOUR } from "../time";
import type { Checkin, DatePlan, Match, Message, ShareLink, User } from "../types";
import { getVenue } from "../venues";
import { assertActive, loadMatch } from "./matches";
import { assertCanInteract, newId } from "./users";

/**
 * From chat to a safe first date:
 *
 *   1. Both people tap "I'd like to meet" (consent first, so nobody is pushed).
 *   2. One proposes a public venue and a time; the other accepts or declines.
 *   3. Either can create a Share-with-a-friend link: a page a trusted friend
 *      can open showing who, where and when. No phone numbers, and it expires
 *      a day after the date.
 *   4. After the date, each person privately checks in: "Did you feel safe?"
 *      A "no" goes straight to the safety team.
 */

const sys = (matchId: string, text: string, now: number): Message => ({
  id: newId(`${matchId}_d`),
  matchId,
  from: "system",
  kind: "system",
  text,
  createdAt: now,
});

export async function setMeetReady(store: DocStore, viewer: User, matchId: string, ready: boolean, now = Date.now()) {
  assertCanInteract(viewer);
  const m = await loadMatch(store, viewer, matchId, now);
  assertActive(m);
  const otherId = m.members.find((x) => x !== viewer.id)!;
  const both = ready && !!m.meetReady?.[otherId];
  await store.batch([
    { type: "update", col: "matches", id: matchId, patch: { [`meetReady.${viewer.id}`]: ready } },
    ...(both
      ? [{ type: "set" as const, col: "messages", id: `${matchId}_meetready`, data: sys(matchId, "🤝 You'd both like to meet! Pick a public spot from Date Plan. Partner venues have perks for Pairwise dates.", now) }]
      : []),
  ]);
  return { both };
}

export async function proposeDate(
  store: DocStore,
  viewer: User,
  matchId: string,
  input: { venueId: string; at: number; note?: string },
  now = Date.now(),
) {
  assertCanInteract(viewer);
  const m = await loadMatch(store, viewer, matchId, now);
  assertActive(m);
  const otherId = m.members.find((x) => x !== viewer.id)!;
  if (!m.meetReady?.[viewer.id] || !m.meetReady?.[otherId]) {
    throw forbidden("You both need to say you'd like to meet first.", "not_ready");
  }
  const venue = getVenue(input.venueId);
  if (!venue || venue.city !== viewer.profile!.city) throw badRequest("Pick a venue in your city.");
  if (input.at < now + 2 * HOUR || input.at > now + 30 * DAY) throw badRequest("Pick a time between 2 hours and 30 days from now.");
  const hour = Number(new Date(input.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false }));
  if (hour < 7 || hour >= 22) throw badRequest("For a first date we suggest daytime or early evening (7 AM–10 PM).", "late_hour");
  if (m.datePlan?.status === "accepted" && m.datePlan.at > now) throw conflict("You already have a date planned.", "already_planned");

  const plan: DatePlan = { venueId: venue.id, at: input.at, proposedBy: viewer.id, status: "proposed", note: input.note?.slice(0, 140) };
  await store.batch([
    { type: "update", col: "matches", id: matchId, patch: { datePlan: plan, lastMessageAt: now, lastMessageBy: "system", lastMessagePreview: "📍 Date proposed" } },
    { type: "set", col: "messages", id: newId(`${matchId}_p`), data: sys(matchId, `📍 ${viewer.profile!.firstName} suggested ${venue.name}, ${venue.area} on ${formatIst(input.at)}.`, now) },
  ]);
  return plan;
}

export async function respondToDate(store: DocStore, viewer: User, matchId: string, accept: boolean, now = Date.now()) {
  assertCanInteract(viewer);
  const m = await loadMatch(store, viewer, matchId, now);
  assertActive(m);
  if (!m.datePlan || m.datePlan.status !== "proposed") throw badRequest("There's no proposal to respond to.");
  if (m.datePlan.proposedBy === viewer.id) throw forbidden("Waiting for them to respond.");
  const venue = getVenue(m.datePlan.venueId)!;
  await store.batch([
    { type: "update", col: "matches", id: matchId, patch: { "datePlan.status": accept ? "accepted" : "declined" } },
    {
      type: "set",
      col: "messages",
      id: newId(`${matchId}_r`),
      data: sys(
        matchId,
        accept
          ? `✅ It's a date: ${venue.name}, ${formatIst(m.datePlan.at)}. Tip: share the plan with a friend from the Date Plan card.`
          : `${viewer.profile!.firstName} can't make that one. Suggest another time or place?`,
        now,
      ),
    },
  ]);
}

export async function createShareLink(store: DocStore, viewer: User, matchId: string, now = Date.now()) {
  const m = await loadMatch(store, viewer, matchId, now);
  if (m.datePlan?.status !== "accepted") throw badRequest("Share links are for accepted date plans.");
  const token = randomBytes(18).toString("base64url");
  const link: ShareLink = { id: token, matchId, uid: viewer.id, createdAt: now, expiresAt: m.datePlan.at + DAY };
  await store.set("shares", token, link);
  return { token, expiresAt: link.expiresAt };
}

/** Public: what a trusted friend sees. First names and badges only. */
export async function readShareLink(store: DocStore, token: string, now = Date.now()) {
  const link = await store.get<ShareLink>("shares", token);
  if (!link || link.expiresAt < now) throw notFound("This link has expired.");
  const m = await store.get<Match>("matches", link.matchId);
  if (!m?.datePlan) throw notFound("This plan no longer exists.");
  const [me, them] = await store.getMany<User>("users", [link.uid, m.members.find((x) => x !== link.uid)!]);
  if (!me?.profile || !them?.profile) throw notFound("This plan no longer exists.");
  return {
    sharer: me.profile.firstName,
    with: {
      firstName: them.profile.firstName,
      verified: them.verification.identity,
      via: them.verification.method,
      employer: them.verification.work?.employer,
      role: them.profile.role,
      avatarSeed: them.profile.avatarSeed,
    },
    venue: getVenue(m.datePlan.venueId)!,
    at: m.datePlan.at,
    status: m.datePlan.status,
    cancelled: m.status !== "active",
    expiresAt: link.expiresAt,
  };
}

export async function checkIn(
  store: DocStore,
  viewer: User,
  matchId: string,
  input: { safe: boolean; again: Checkin["again"]; details?: string },
  now = Date.now(),
) {
  const m: Match = await loadMatch(store, viewer, matchId, now);
  if (m.datePlan?.status !== "accepted" || m.datePlan.at > now) throw badRequest("Check-ins open after your date.");
  const checkin: Checkin = { safe: input.safe, again: input.again, at: now };
  await store.update("matches", matchId, { [`checkins.${viewer.id}`]: checkin });
  if (!input.safe) {
    const { fileReport } = await import("./moderation");
    const otherId = m.members.find((x) => x !== viewer.id)!;
    await fileReport(store, viewer, { reported: otherId, matchId, category: "offline_behaviour", details: input.details || "Post-date check-in: did not feel safe." }, now);
  }
  return checkin;
}
