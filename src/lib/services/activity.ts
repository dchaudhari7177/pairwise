import type { DocStore } from "../store/types";
import { DAY, formatIst } from "../time";
import type { Like, Match, User } from "../types";
import { getVenue } from "../venues";
import { blockedSet } from "./discovery";
import { toCard, type ProfileCard } from "./profiles";

/**
 * The activity feed: everything that happened to you that is worth a look,
 * newest first. It's derived from likes and matches rather than stored as
 * separate notification documents, so it can never drift out of sync with
 * the real state, and deleting a match or a like removes its notifications.
 *
 * Deliberately calm: no "someone viewed your profile", no streaks, no
 * "you're missing out". Every item points at something you can act on.
 */

export type ActivityKind =
  | "like"
  | "match"
  | "spark_started"
  | "spark_solved"
  | "date_proposed"
  | "date_accepted"
  | "date_declined"
  | "checkin_due"
  | "closed";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  at: number;
  who: { id: string; firstName: string; avatarSeed: string; gender: ProfileCard["gender"]; photo: ProfileCard["photo"] };
  title: string;
  detail?: string;
  href: string;
}

const WINDOW_DAYS = 21;
const MAX_ITEMS = 40;

export async function listActivity(store: DocStore, viewer: User, now = Date.now()): Promise<{ items: ActivityItem[]; unseen: number }> {
  const since = now - WINDOW_DAYS * DAY;
  const [likes, matches, blocked] = await Promise.all([
    store.query<Like>("likes", [["to", "==", viewer.id]]),
    store.query<Match>("matches", [["members", "array-contains", viewer.id]]),
    blockedSet(store, viewer.id),
  ]);

  // Queued likes (inbound cap) stay invisible until they're delivered.
  const delivered = likes.filter((l) => l.deliverAt <= now && l.deliverAt >= since && l.status !== "passed");
  const otherOf = (m: Match) => (m.members[0] === viewer.id ? m.members[1] : m.members[0]);
  const ids = [...new Set([...delivered.map((l) => l.from), ...matches.map(otherOf)])].filter((id) => !blocked.has(id));
  const people = new Map((await store.getMany<User>("users", ids)).filter((u): u is User => !!u?.profile).map((u) => [u.id, u]));

  const items: ActivityItem[] = [];
  const matchedWith = new Set(matches.map(otherOf));
  // Photos follow the same blur rules as everywhere else: full only once matched (or if they don't blur).
  const who = (u: User) => {
    const c = toCard(u, { matched: matchedWith.has(u.id), now });
    return { id: u.id, firstName: c.firstName, avatarSeed: c.avatarSeed, gender: c.gender, photo: c.photo };
  };
  const push = (item: ActivityItem) => {
    if (item.at >= since && item.at <= now) items.push(item);
  };

  for (const l of delivered) {
    const u = people.get(l.from);
    if (!u || matchedWith.has(u.id)) continue; // the match item tells that story
    const prompt = l.promptIndex !== undefined ? viewer.profile?.prompts[l.promptIndex]?.q : undefined;
    push({
      id: `like_${l.id}`,
      kind: "like",
      at: l.deliverAt,
      who: who(u),
      title: prompt ? `${u.profile!.firstName} liked your answer to “${prompt}”` : `${u.profile!.firstName} liked your profile`,
      detail: l.note ? `“${l.note}”` : undefined,
      href: "/likes",
    });
  }

  for (const m of matches) {
    const u = people.get(otherOf(m));
    if (!u) continue;
    const name = u.profile!.firstName;
    const chat = `/chats/${m.id}`;
    push({ id: `match_${m.id}`, kind: "match", at: m.createdAt, who: who(u), title: `You and ${name} matched`, detail: "Say something better than “hi”, or start a Spark.", href: chat });

    if (m.spark) {
      if (m.spark.startedBy !== viewer.id && !m.spark.solvedAt) {
        push({ id: `spark_${m.id}_${m.spark.startedAt}`, kind: "spark_started", at: m.spark.startedAt, who: who(u), title: `${name} started a Spark puzzle`, detail: "You hold half the clues. Compare notes in the chat.", href: `${chat}?tab=spark` });
      }
      if (m.spark.solvedAt) {
        push({ id: `solved_${m.id}_${m.spark.solvedAt}`, kind: "spark_solved", at: m.spark.solvedAt, who: who(u), title: `You and ${name} solved a Spark together`, href: `${chat}?tab=spark` });
      }
    }

    const plan = m.datePlan;
    const venue = plan ? getVenue(plan.venueId) : undefined;
    if (plan && venue) {
      const when = formatIst(plan.at);
      if (plan.status === "proposed" && plan.proposedBy !== viewer.id) {
        push({ id: `date_${m.id}_${plan.at}`, kind: "date_proposed", at: plan.proposedAt ?? m.lastMessageAt ?? m.createdAt, who: who(u), title: `${name} suggested meeting at ${venue.name}`, detail: `${when}. Accept, or suggest another time.`, href: `${chat}?tab=meet` });
      }
      if (plan.status !== "proposed" && plan.proposedBy === viewer.id && plan.respondedAt) {
        const accepted = plan.status === "accepted";
        push({
          id: `reply_${m.id}_${plan.at}`,
          kind: accepted ? "date_accepted" : "date_declined",
          at: plan.respondedAt,
          who: who(u),
          title: accepted ? `${name} accepted: it's a date at ${venue.name}` : `${name} can't make ${venue.name}`,
          detail: accepted ? `${when}. Share the plan with a friend before you go.` : "No pressure. You can suggest another plan.",
          href: `${chat}?tab=meet`,
        });
      }
      // A private check-in, the morning after: did you feel safe?
      if (plan.status === "accepted" && plan.at <= now && !m.checkins?.[viewer.id]) {
        push({ id: `checkin_${m.id}_${plan.at}`, kind: "checkin_due", at: plan.at + 3 * 60 * 60 * 1000, who: who(u), title: `How did it go with ${name}?`, detail: "A private, 10-second check-in. They never see your answer.", href: `${chat}?tab=meet` });
      }
    }

    if (m.status === "closed" && m.closedBy && m.closedBy !== viewer.id && m.closedAt && m.closeReason === "kindly") {
      push({ id: `closed_${m.id}`, kind: "closed", at: m.closedAt, who: who(u), title: `${name} closed your conversation kindly`, detail: "That frees a slot for someone new.", href: chat });
    }
  }

  items.sort((a, b) => b.at - a.at || a.id.localeCompare(b.id));
  const top = items.slice(0, MAX_ITEMS);
  const seen = viewer.activitySeenAt ?? 0;
  return { items: top, unseen: top.filter((i) => i.at > seen).length };
}

export async function markActivitySeen(store: DocStore, viewer: User, now = Date.now()) {
  await store.update("users", viewer.id, { activitySeenAt: now });
}
