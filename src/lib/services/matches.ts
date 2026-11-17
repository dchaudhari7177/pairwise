import { badRequest, conflict, forbidden, notFound } from "../errors";
import { LIMITS } from "../options";
import { rateLimit } from "../rate-limit";
import { AUTO_REPORT_STRIKES, evaluate } from "../safety/scam-shield";
import { getPuzzle, playerView, type PlayerView } from "../spark/puzzles";
import { inc, type DocStore, type WriteOp } from "../store/types";
import { DAY, HOUR } from "../time";
import type { Checkin, Match, Message, Report, ScamSignal, User } from "../types";
import { getVenue, type Venue } from "../venues";
import { toCard, type ProfileCard } from "./profiles";
import { assertCanInteract, newId, slotLimit } from "./users";

export const KIND_CLOSE_TEMPLATES = [
  "I've really enjoyed talking, but I don't feel the spark I'm looking for. Wishing you the very best!",
  "Thank you for the lovely conversation. I don't think we're the right match, but I hope you find your person soon.",
  "I'm going to focus on fewer conversations for now. It was genuinely nice getting to know you. Take care!",
];

const other = (m: Match, uid: string) => (m.members[0] === uid ? m.members[1] : m.members[0]);

function isExpired(m: Match, now: number) {
  return m.status === "active" && (m.lastMessageAt ?? m.createdAt) < now - LIMITS.expiryDays * DAY;
}

/** Lazily expire idle conversations so their slots free up. */
async function expireIfIdle(store: DocStore, m: Match, now: number): Promise<Match> {
  if (!isExpired(m, now)) return m;
  const patch = { status: "expired" as const, closeReason: "expired" as const, closedAt: now };
  await store.batch([
    { type: "update", col: "matches", id: m.id, patch },
    {
      type: "set",
      col: "messages",
      id: `${m.id}_exp`,
      data: { id: `${m.id}_exp`, matchId: m.id, from: "system", kind: "system", text: `This conversation went quiet for ${LIMITS.expiryDays} days, so it closed and both slots were freed. No hard feelings.`, createdAt: now } satisfies Message,
    },
  ]);
  return { ...m, ...patch };
}

export async function loadMatch(store: DocStore, viewer: User, matchId: string, now = Date.now()): Promise<Match> {
  const m = await store.get<Match>("matches", matchId);
  if (!m || !m.members.includes(viewer.id)) throw notFound("Conversation not found.");
  return expireIfIdle(store, m, now);
}

export interface MatchSummary {
  id: string;
  other: ProfileCard;
  status: Match["status"];
  closedByMe: boolean;
  closeReason?: Match["closeReason"];
  preview?: string;
  lastMessageAt?: number;
  unread: number;
  /** The other person spoke last and is waiting on you. */
  yourTurn: boolean;
  waitingHours: number;
  nudge: boolean;
  expiresInHours: number;
  hasSpark: boolean;
  sparkSolved: boolean;
  datePlanned: boolean;
  /** Matched, but neither person has written yet. */
  fresh: boolean;
  createdAt: number;
}

export async function listMatches(store: DocStore, viewer: User, now = Date.now()) {
  const raw = await store.query<Match>("matches", [["members", "array-contains", viewer.id]]);
  const matches = await Promise.all(raw.map((m) => expireIfIdle(store, m, now)));
  const others = await store.getMany<User>("users", matches.map((m) => other(m, viewer.id)));
  const out: MatchSummary[] = [];
  matches.forEach((m, i) => {
    const o = others[i];
    if (!o?.profile) return;
    const last = m.lastMessageAt ?? m.createdAt;
    const yourTurn = m.status === "active" && m.lastMessageBy !== undefined && m.lastMessageBy !== viewer.id && m.lastMessageBy !== "system";
    const waitingHours = Math.floor((now - last) / HOUR);
    out.push({
      id: m.id,
      other: toCard(o, { matched: true, now }),
      status: m.status,
      closedByMe: m.closedBy === viewer.id,
      closeReason: m.closeReason,
      preview: m.lastMessagePreview,
      lastMessageAt: m.lastMessageAt,
      unread: m.unread?.[viewer.id] ?? 0,
      yourTurn,
      waitingHours,
      nudge: yourTurn && waitingHours >= LIMITS.nudgeHours,
      expiresInHours: Math.max(0, Math.round((last + LIMITS.expiryDays * DAY - now) / HOUR)),
      hasSpark: !!m.spark,
      sparkSolved: !!m.spark?.solvedAt,
      datePlanned: m.datePlan?.status === "accepted",
      fresh: m.status === "active" && Object.values(m.messageCounts ?? {}).every((n) => !n),
      createdAt: m.createdAt,
    });
  });
  out.sort((a, b) => (b.lastMessageAt ?? b.createdAt) - (a.lastMessageAt ?? a.createdAt));
  const active = out.filter((m) => m.status === "active");
  return { active, closed: out.filter((m) => m.status !== "active"), slots: { used: active.length, limit: slotLimit(viewer) } };
}

export interface ChatMessage {
  id: string;
  from: "me" | "them" | "system";
  kind: Message["kind"];
  text: string;
  at: number;
  /** Safety tip shown only to the receiver of a flagged message. */
  tip?: string;
  signals?: ScamSignal[];
}

export interface SparkView {
  puzzle: PlayerView;
  role: "A" | "B";
  attempts: number;
  solved: boolean;
  solvedAt?: number;
  startedByMe: boolean;
  answer?: string | number;
}

export interface Conversation {
  match: Pick<Match, "id" | "status" | "createdAt" | "closeReason"> & { closedByMe: boolean };
  other: ProfileCard;
  messages: ChatMessage[];
  spark: SparkView | null;
  datePlan: (Match["datePlan"] & { venue: Venue | undefined; proposedByMe: boolean }) | null;
  myCheckin: Checkin | null;
  meetReady: { me: boolean; them: boolean };
  expiresInHours: number;
}

export function sparkView(m: Match, uid: string): SparkView | null {
  if (!m.spark) return null;
  const puzzle = getPuzzle(m.spark.puzzleId);
  if (!puzzle) return null;
  const role = m.spark.roles[uid] ?? "A";
  return {
    puzzle: playerView(puzzle, role),
    role,
    attempts: m.spark.attempts,
    solved: !!m.spark.solvedAt,
    solvedAt: m.spark.solvedAt,
    startedByMe: m.spark.startedBy === uid,
    answer: m.spark.solvedAt ? puzzle.answer : undefined,
  };
}

export async function getConversation(store: DocStore, viewer: User, matchId: string, now = Date.now()): Promise<Conversation> {
  const m = await loadMatch(store, viewer, matchId, now);
  const otherId = other(m, viewer.id);
  const [o, msgs] = await Promise.all([
    store.get<User>("users", otherId),
    store.query<Message>("messages", [["matchId", "==", matchId]]),
  ]);
  if (!o?.profile) throw notFound("This member is no longer on Pairwise.");
  msgs.sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  const messages: ChatMessage[] = msgs.slice(-300).map((x) => ({
    id: x.id,
    from: x.from === "system" ? "system" : x.from === viewer.id ? "me" : "them",
    kind: x.kind,
    text: x.text,
    at: x.createdAt,
    tip: x.from !== viewer.id && x.from !== "system" ? x.tip : undefined,
    signals: x.from !== viewer.id ? x.signals : undefined,
  }));
  if (m.unread?.[viewer.id]) await store.update("matches", m.id, { [`unread.${viewer.id}`]: 0 });
  const last = m.lastMessageAt ?? m.createdAt;
  return {
    match: { id: m.id, status: m.status, createdAt: m.createdAt, closeReason: m.closeReason, closedByMe: m.closedBy === viewer.id },
    other: toCard(o, { matched: true, now }),
    messages,
    spark: sparkView(m, viewer.id),
    datePlan: m.datePlan ? { ...m.datePlan, venue: getVenue(m.datePlan.venueId), proposedByMe: m.datePlan.proposedBy === viewer.id } : null,
    myCheckin: m.checkins?.[viewer.id] ?? null,
    // The other person's readiness is only revealed once you are ready too: no pressure, no awkward "no".
    meetReady: { me: !!m.meetReady?.[viewer.id], them: !!m.meetReady?.[viewer.id] && !!m.meetReady?.[otherId] },
    expiresInHours: Math.max(0, Math.round((last + LIMITS.expiryDays * DAY - now) / HOUR)),
  };
}

export function assertActive(m: Match) {
  if (m.status !== "active") throw conflict("This conversation is closed.", "closed");
}

export async function sendMessage(
  store: DocStore,
  viewer: User,
  matchId: string,
  text: string,
  opts: { confirm?: boolean } = {},
  now = Date.now(),
) {
  assertCanInteract(viewer);
  const body = text.trim();
  if (!body) throw badRequest("Say something!");
  if (body.length > LIMITS.messageMaxChars) throw badRequest("That message is too long.");
  const m = await loadMatch(store, viewer, matchId, now);
  assertActive(m);
  await rateLimit(store, `msg:${viewer.id}`, 20, 60 * 1000, now);

  const verdict = evaluate(body, {
    matchAgeHours: (now - m.createdAt) / HOUR,
    senderMessageCount: m.messageCounts?.[viewer.id] ?? 0,
  });
  if (verdict.confirmPrompt && !opts.confirm) {
    throw conflict(verdict.confirmPrompt, "confirm_contact");
  }

  const otherId = other(m, viewer.id);
  const msg: Message = {
    id: newId(`${matchId}_`),
    matchId,
    from: viewer.id,
    kind: "text",
    text: body,
    createdAt: now,
    signals: verdict.signals.length ? verdict.signals : undefined,
    tip: verdict.receiverTip,
  };
  const ops: WriteOp[] = [
    { type: "set", col: "messages", id: msg.id, data: msg },
    {
      type: "update",
      col: "matches",
      id: matchId,
      patch: {
        lastMessageAt: now,
        lastMessageBy: viewer.id,
        lastMessagePreview: body.slice(0, 80),
        [`messageCounts.${viewer.id}`]: inc(1),
        [`unread.${otherId}`]: inc(1),
      },
    },
  ];

  if (verdict.strike) {
    const strikes = (viewer.trust?.scamFlags ?? 0) + 1;
    ops.push({ type: "update", col: "users", id: viewer.id, patch: { "trust.scamFlags": inc(1) } });
    if (strikes >= AUTO_REPORT_STRIKES) {
      const existing = await store.query<Report>("reports", [
        ["reported", "==", viewer.id],
        ["reporter", "==", "system"],
      ]);
      if (!existing.some((r) => r.status === "open")) {
        const report: Report = {
          id: newId("r_"),
          reporter: "system",
          reported: viewer.id,
          matchId,
          category: "scam_or_money",
          details: `Scam Shield: ${strikes} money/crypto/UPI signals. Latest: “${body.slice(0, 160)}”`,
          status: "open",
          createdAt: now,
        };
        ops.push({ type: "set", col: "reports", id: report.id, data: report });
      }
    }
  }
  await store.batch(ops);
  return { id: msg.id, signals: verdict.signals };
}

export async function closeMatch(
  store: DocStore,
  viewer: User,
  matchId: string,
  mode: "kindly" | "quietly",
  templateIndex = 0,
  now = Date.now(),
) {
  const m = await loadMatch(store, viewer, matchId, now);
  assertActive(m);
  const name = viewer.profile?.firstName ?? "They";
  const template = KIND_CLOSE_TEMPLATES[templateIndex];
  if (mode === "kindly" && !template) throw badRequest("Pick a message.");
  const text =
    mode === "kindly" ? `${name} closed this conversation kindly: “${template}”` : "This conversation has been closed.";
  await store.batch([
    { type: "update", col: "matches", id: matchId, patch: { status: "closed", closedBy: viewer.id, closedAt: now, closeReason: mode } },
    { type: "set", col: "messages", id: `${matchId}_close`, data: { id: `${matchId}_close`, matchId, from: "system", kind: "system", text, createdAt: now } satisfies Message },
  ]);
}

export function assertMember(m: Match, uid: string) {
  if (!m.members.includes(uid)) throw forbidden();
}
