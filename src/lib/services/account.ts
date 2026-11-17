import { verifyPassword } from "../auth/password";
import { unauthorized } from "../errors";
import type { DocStore, WriteOp } from "../store/types";
import type { Block, Credential, Like, Match, Message, Pass, Payment, Photo, PicksDoc, Report, ShareLink, User } from "../types";

/**
 * Data-principal rights under India's DPDP Act, 2023: access (export) and
 * erasure (delete). Deletion is real. We don't just set a "deleted" flag.
 * Your messages in other people's chats are replaced with a placeholder so
 * their conversation still makes sense without keeping your words.
 *
 * Kept after deletion: payment records (tax law requires about 8 years under
 * the CGST Act) and reports *about* you, with your identity reduced to an
 * opaque id, so a banned scammer can't wipe their record and come back.
 */

export async function exportData(store: DocStore, user: User) {
  const [likesSent, likesReceived, passes, matches, blocks, reportsFiled, payments, photos] = await Promise.all([
    store.query<Like>("likes", [["from", "==", user.id]]),
    store.query<Like>("likes", [["to", "==", user.id]]),
    store.query<Pass>("passes", [["from", "==", user.id]]),
    store.query<Match>("matches", [["members", "array-contains", user.id]]),
    store.query<Block>("blocks", [["by", "==", user.id]]),
    store.query<Report>("reports", [["reporter", "==", user.id]]),
    store.query<Payment>("payments", [["uid", "==", user.id]]),
    store.query<Photo>("photos", [["owner", "==", user.id]]),
  ]);
  const messages: Message[] = [];
  for (const m of matches) {
    const msgs = await store.query<Message>("messages", [["matchId", "==", m.id]]);
    messages.push(...msgs.filter((x) => x.from === user.id));
  }
  const { trust: _trust, exposure: _exposure, ...account } = user;
  return {
    exportedAt: new Date().toISOString(),
    notice:
      "This is all the personal data Pairwise holds about you. Likes you received show only the sender's id; their profiles are their data.",
    account,
    likesSent,
    likesReceived: likesReceived.map((l) => ({ from: l.from, at: l.createdAt, note: l.note, status: l.status })),
    passes,
    matches: matches.map((m) => ({ id: m.id, createdAt: m.createdAt, status: m.status, datePlan: m.datePlan, checkin: m.checkins?.[user.id] })),
    messagesYouSent: messages,
    blocks,
    reportsYouFiled: reportsFiled,
    payments,
    photos: photos.map((p) => ({ id: p.id, createdAt: p.createdAt })),
  };
}

export async function deleteAccount(store: DocStore, user: User, password: string, now = Date.now()) {
  const cred = await store.get<Credential>("credentials", user.email);
  if (!cred || !(await verifyPassword(password, cred.passwordHash))) throw unauthorized("Password is incorrect.");

  const [likesA, likesB, passesA, passesB, matches, blocksA, blocksB, photos, picks, shares, reportsFiled] = await Promise.all([
    store.query<Like>("likes", [["from", "==", user.id]]),
    store.query<Like>("likes", [["to", "==", user.id]]),
    store.query<Pass>("passes", [["from", "==", user.id]]),
    store.query<Pass>("passes", [["to", "==", user.id]]),
    store.query<Match>("matches", [["members", "array-contains", user.id]]),
    store.query<Block>("blocks", [["by", "==", user.id]]),
    store.query<Block>("blocks", [["target", "==", user.id]]),
    store.query<Photo>("photos", [["owner", "==", user.id]]),
    store.query<PicksDoc>("picks", [["uid", "==", user.id]]),
    store.query<ShareLink>("shares", [["uid", "==", user.id]]),
    store.query<Report>("reports", [["reporter", "==", user.id]]),
  ]);

  const ops: WriteOp[] = [
    { type: "delete", col: "users", id: user.id },
    { type: "delete", col: "credentials", id: user.email },
    { type: "delete", col: "otps", id: user.id },
  ];
  for (const x of [...likesA, ...likesB]) ops.push({ type: "delete", col: "likes", id: x.id });
  for (const x of [...passesA, ...passesB]) ops.push({ type: "delete", col: "passes", id: x.id });
  for (const x of [...blocksA, ...blocksB]) ops.push({ type: "delete", col: "blocks", id: x.id });
  for (const x of photos) ops.push({ type: "delete", col: "photos", id: x.id });
  for (const x of picks) ops.push({ type: "delete", col: "picks", id: x.id });
  for (const x of shares) ops.push({ type: "delete", col: "shares", id: x.id });
  for (const r of reportsFiled) ops.push({ type: "update", col: "reports", id: r.id, patch: { reporter: "deleted" } });

  for (const m of matches) {
    const msgs = await store.query<Message>("messages", [["matchId", "==", m.id]]);
    for (const msg of msgs) {
      if (msg.from === user.id) ops.push({ type: "update", col: "messages", id: msg.id, patch: { text: "Message removed: this member deleted their account.", from: "system", kind: "system", signals: null, tip: null } });
    }
    if (m.status === "active") {
      ops.push({ type: "update", col: "matches", id: m.id, patch: { status: "closed", closedBy: user.id, closedAt: now, closeReason: "account_deleted", lastMessagePreview: "This member left Pairwise" } });
    }
  }
  await store.batch(ops);
}
