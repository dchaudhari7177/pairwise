import { conflict, forbidden, notFound, badRequest } from "../errors";
import { assess, browsingCity } from "../matching/compatibility";
import { rankPicks, type Candidate } from "../matching/picks";
import { LIMITS } from "../options";
import { evaluate } from "../safety/scam-shield";
import { inc, type DocStore, type WriteOp } from "../store/types";
import { addDays, istDay, istDayStart, isoWeek } from "../time";
import type { Block, Like, Match, Pass, PicksDoc, User } from "../types";
import { toCard, type ProfileCard } from "./profiles";
import { assertCanInteract, getUser, picksLimit, slotLimit } from "./users";

export const pairId = (a: string, b: string) => [a, b].sort().join("__");

export async function blockedSet(store: DocStore, uid: string): Promise<Set<string>> {
  const [mine, theirs] = await Promise.all([
    store.query<Block>("blocks", [["by", "==", uid]]),
    store.query<Block>("blocks", [["target", "==", uid]]),
  ]);
  return new Set([...mine.map((b) => b.target), ...theirs.map((b) => b.by)]);
}

/** Everyone the viewer has already acted on, so they never resurface. */
async function excludedSet(store: DocStore, uid: string): Promise<Set<string>> {
  const [likes, passes, matches] = await Promise.all([
    store.query<Like>("likes", [["from", "==", uid]]),
    store.query<Pass>("passes", [["from", "==", uid]]),
    store.query<Match>("matches", [["members", "array-contains", uid]]),
  ]);
  return new Set([
    ...likes.map((l) => l.to),
    ...passes.map((p) => p.to),
    ...matches.flatMap((m) => m.members.filter((x) => x !== uid)),
  ]);
}

export async function activeMatchCount(store: DocStore, uid: string): Promise<number> {
  const matches = await store.query<Match>("matches", [["members", "array-contains", uid]]);
  return matches.filter((m) => m.status === "active").length;
}

export interface TodayPick {
  card: ProfileCard;
  score: number;
  reasons: string[];
  likedYou: boolean;
}

/**
 * Today's picks for a viewer: computed once per IST day and cached, so the
 * list is stable through the day (no refreshing for "better" people).
 * Already-acted-on picks drop out as you go.
 */
export async function todaysPicks(store: DocStore, viewer: User, now = Date.now()) {
  assertCanInteract(viewer);
  const day = istDay(now);
  const docId = `${viewer.id}_${day}`;
  let doc = await store.get<PicksDoc>("picks", docId);

  if (!doc) {
    const city = browsingCity(viewer);
    const [pool, excluded, blocked] = await Promise.all([
      store.query<User>("users", [
        ["profile.city", "==", city],
        ["status", "==", "active"],
      ]),
      excludedSet(store, viewer.id),
      blockedSet(store, viewer.id),
    ]);
    const ids = pool.map((u) => u.id);
    const pending = ids.length
      ? await store.query<Like>("likes", [
          ["to", "in", ids],
          ["status", "==", "pending"],
        ])
      : [];
    const pendingBy = new Map<string, number>();
    for (const l of pending) pendingBy.set(l.to, (pendingBy.get(l.to) ?? 0) + 1);
    const candidates: Candidate[] = pool
      .filter((u) => u.onboarded && u.profile)
      .map((user) => ({ user, pendingInbound: pendingBy.get(user.id) ?? 0 }));

    const picks = rankPicks(viewer, candidates, { count: picksLimit(viewer), day, now, excluded, blocked });
    doc = {
      id: docId,
      uid: viewer.id,
      day,
      picks: picks.map((p) => ({ uid: p.uid, score: p.score, reasons: p.reasons })),
      createdAt: now,
    };
    const week = isoWeek(now);
    const ops: WriteOp[] = [{ type: "set", col: "picks", id: docId, data: doc }];
    for (const p of picks) {
      const u = candidates.find((c) => c.user.id === p.uid)!.user;
      ops.push({
        type: "update",
        col: "users",
        id: p.uid,
        patch: u.exposure.week === week ? { "exposure.count": inc(1) } : { exposure: { week, count: 1 } },
      });
    }
    await store.batch(ops);
  }

  const [excluded, blocked, users, likedMe] = await Promise.all([
    excludedSet(store, viewer.id),
    blockedSet(store, viewer.id),
    store.getMany<User>("users", doc.picks.map((p) => p.uid)),
    store.query<Like>("likes", [["to", "==", viewer.id]]),
  ]);
  const likedMeSet = new Set(likedMe.filter((l) => l.status === "pending").map((l) => l.from));

  const remaining: TodayPick[] = [];
  doc.picks.forEach((p, i) => {
    const u = users[i];
    if (!u || excluded.has(p.uid) || blocked.has(p.uid)) return;
    if (u.status !== "active") return;
    remaining.push({ card: toCard(u, { now }), score: p.score, reasons: p.reasons, likedYou: likedMeSet.has(p.uid) });
  });

  return {
    day,
    picks: remaining,
    total: doc.picks.length,
    acted: doc.picks.length - remaining.length,
    limit: picksLimit(viewer),
    refreshesAt: istDayStart(addDays(day, 1)),
  };
}

/** Find the first day (from today) on which the recipient has inbound capacity. */
async function deliveryDay(store: DocStore, to: string, now: number): Promise<{ day: string; at: number }> {
  const today = istDay(now);
  // Equality-only query (no composite index needed); filter the range in memory.
  const upcoming = (await store.query<Like>("likes", [["to", "==", to]])).filter((l) => l.deliverDay >= today);
  const perDay = new Map<string, number>();
  for (const l of upcoming) perDay.set(l.deliverDay, (perDay.get(l.deliverDay) ?? 0) + 1);
  for (let i = 0; i < 60; i++) {
    const day = addDays(today, i);
    if ((perDay.get(day) ?? 0) < LIMITS.inboundDailyCap) {
      return { day, at: i === 0 ? now : istDayStart(day) + 9 * 60 * 60 * 1000 }; // queued likes land at 9 AM IST
    }
  }
  return { day: addDays(today, 60), at: istDayStart(addDays(today, 60)) };
}

export interface LikeInput {
  promptIndex?: number;
  note?: string;
}

export type LikeResult = { matched: false; queued: boolean } | { matched: true; matchId: string };

export async function like(
  store: DocStore,
  viewer: User,
  targetId: string,
  input: LikeInput = {},
  now = Date.now(),
): Promise<LikeResult> {
  assertCanInteract(viewer);
  if (targetId === viewer.id) throw badRequest("That's you!");
  const target = await getUser(store, targetId);
  if (!target?.profile) throw notFound("This person isn't available anymore.");

  const blocked = await blockedSet(store, viewer.id);
  const a = assess(viewer, target, { now, blocked });
  if (a.blockers.length) throw forbidden("This person isn't available anymore.", "unavailable");

  const theirLike = await store.get<Like>("likes", `${targetId}__${viewer.id}`);
  const likedBack = theirLike?.status === "pending" && theirLike.deliverAt <= now;

  // You can only like people from today's picks, or someone who liked you.
  // This stops scraping and keeps the "few, considered choices" promise.
  if (!likedBack) {
    const picks = await store.get<PicksDoc>("picks", `${viewer.id}_${istDay(now)}`);
    if (!picks?.picks.some((p) => p.uid === targetId)) {
      throw forbidden("You can like people from today's picks or people who liked you.", "not_in_picks");
    }
  }

  if (await store.get<Like>("likes", `${viewer.id}__${targetId}`)) throw conflict("You've already liked them.", "already_liked");

  const slots = await activeMatchCount(store, viewer.id);
  if (slots >= slotLimit(viewer)) {
    throw conflict(
      `All ${slotLimit(viewer)} of your conversation slots are in use. Close one kindly to make room. It keeps things fair for everyone.`,
      "slots_full",
    );
  }

  const note = input.note?.trim();
  if (note && note.length > LIMITS.noteMaxChars) throw badRequest(`Keep your note under ${LIMITS.noteMaxChars} characters.`);
  if (note && evaluate(note, { matchAgeHours: 0, senderMessageCount: 0 }).strike) {
    throw badRequest("Notes can't include payment or investment requests.", "note_blocked");
  }
  if (input.promptIndex !== undefined && !target.profile.prompts[input.promptIndex]) throw badRequest("Pick one of their prompts.");

  if (likedBack) {
    const matchId = pairId(viewer.id, targetId);
    const match: Match = {
      id: matchId,
      members: [viewer.id, targetId].sort() as [string, string],
      createdAt: now,
      status: "active",
      messageCounts: { [viewer.id]: 0, [targetId]: 0 },
      unread: { [viewer.id]: 0, [targetId]: 1 },
      meetReady: {},
      lastMessageAt: now,
    };
    const firstNote = theirLike!.note;
    const ops: WriteOp[] = [
      { type: "set", col: "likes", id: `${viewer.id}__${targetId}`, data: { id: `${viewer.id}__${targetId}`, from: viewer.id, to: targetId, note, promptIndex: input.promptIndex, createdAt: now, deliverAt: now, deliverDay: istDay(now), status: "matched" } satisfies Like },
      { type: "update", col: "likes", id: theirLike!.id, patch: { status: "matched" } },
      { type: "set", col: "matches", id: matchId, data: match },
      {
        type: "set",
        col: "messages",
        id: `${matchId}_0`,
        data: {
          id: `${matchId}_0`,
          matchId,
          from: "system",
          kind: "system",
          text: firstNote
            ? `It's mutual! ${target.profile.firstName}'s note: “${firstNote}”`
            : "It's mutual! Start a Spark puzzle together, or say something better than “hi” 😊",
          createdAt: now,
        },
      },
    ];
    await store.batch(ops);
    return { matched: true, matchId };
  }

  const { day, at } = await deliveryDay(store, targetId, now);
  const likeDoc: Like = {
    id: `${viewer.id}__${targetId}`,
    from: viewer.id,
    to: targetId,
    note,
    promptIndex: input.promptIndex,
    createdAt: now,
    deliverAt: at,
    deliverDay: day,
    status: "pending",
  };
  await store.set("likes", likeDoc.id, likeDoc);
  return { matched: false, queued: at > now };
}

export async function pass(store: DocStore, viewer: User, targetId: string, now = Date.now()) {
  assertCanInteract(viewer);
  const ops: WriteOp[] = [
    { type: "set", col: "passes", id: `${viewer.id}__${targetId}`, data: { id: `${viewer.id}__${targetId}`, from: viewer.id, to: targetId, createdAt: now } satisfies Pass },
  ];
  // If they had liked you, their like quietly closes. They are never told.
  const theirLike = await store.get<Like>("likes", `${targetId}__${viewer.id}`);
  if (theirLike?.status === "pending") ops.push({ type: "update", col: "likes", id: theirLike.id, patch: { status: "passed" } });
  await store.batch(ops);
}

export interface ReceivedLike {
  card: ProfileCard;
  note?: string;
  prompt?: { q: string; a: string };
  score: number;
  reasons: string[];
  at: number;
}

/**
 * People who liked you, visible to everyone for free. (We never sell
 * "see who likes you".) Delivery is capped per day by the inbound cap, so
 * we also report how many are queued for later.
 */
export async function likesReceived(store: DocStore, viewer: User, now = Date.now()) {
  const all = await store.query<Like>("likes", [
    ["to", "==", viewer.id],
    ["status", "==", "pending"],
  ]);
  const delivered = all.filter((l) => l.deliverAt <= now);
  const queued = all.length - delivered.length;
  const blocked = await blockedSet(store, viewer.id);
  const users = await store.getMany<User>("users", delivered.map((l) => l.from));
  const out: ReceivedLike[] = [];
  delivered.forEach((l, i) => {
    const u = users[i];
    if (!u?.profile || u.status !== "active" || blocked.has(u.id)) return;
    const a = viewer.profile ? assess(viewer, u, { now, blocked }) : { score: 0, reasons: [] as string[] };
    out.push({
      card: toCard(u, { now }),
      note: l.note,
      prompt: l.promptIndex !== undefined ? viewer.profile?.prompts[l.promptIndex] : undefined,
      score: a.score,
      reasons: a.reasons,
      at: l.deliverAt,
    });
  });
  out.sort((x, y) => y.score - x.score);
  return { likes: out, queued };
}
