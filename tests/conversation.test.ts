import { describe, expect, it } from "vitest";
import { deleteAccount, exportData } from "@/lib/services/account";
import { checkIn, createShareLink, proposeDate, readShareLink, respondToDate, setMeetReady } from "@/lib/services/dates";
import { closeMatch, getConversation, listMatches, sendMessage } from "@/lib/services/matches";
import { fileReport, listReports, resolveReport } from "@/lib/services/moderation";
import { cancel, settlePlan, subscribe } from "@/lib/services/plus";
import { startSpark, submitSpark } from "@/lib/services/spark";
import { hashPassword } from "@/lib/auth/password";
import { getPuzzle } from "@/lib/spark/puzzles";
import { MemoryStore } from "@/lib/store/memory";
import type { Match, Report, User } from "@/lib/types";
import { makeUser, man, woman } from "./fixtures";

const NOW = Date.parse("2026-11-17T06:00:00Z");
const HOUR = 3600 * 1000;

async function matched() {
  const store = new MemoryStore();
  const a = man();
  const b = woman();
  for (const u of [a, b]) await store.set("users", u.id, u);
  const id = [a.id, b.id].sort().join("__");
  const match: Match = { id, members: [a.id, b.id].sort() as [string, string], createdAt: NOW, status: "active", messageCounts: {}, unread: {}, meetReady: {}, lastMessageAt: NOW };
  await store.set("matches", id, match);
  return { store, a, b, id };
}

const fresh = async (store: MemoryStore, u: User) => (await store.get<User>("users", u.id))!;

describe("messaging", () => {
  it("delivers messages, tracks unread and 'your turn'", async () => {
    const { store, a, b, id } = await matched();
    await sendMessage(store, a, id, "Hey! Your trek prompt made me laugh", {}, NOW + 1000);
    const forB = await listMatches(store, b, NOW + 2000);
    expect(forB.active[0]).toMatchObject({ unread: 1, yourTurn: true });
    const convo = await getConversation(store, b, id, NOW + 3000);
    expect(convo.messages.at(-1)).toMatchObject({ from: "them", text: "Hey! Your trek prompt made me laugh" });
    expect((await listMatches(store, b, NOW + 4000)).active[0].unread).toBe(0);
  });

  it("asks before sharing a phone number early, then sends on confirm", async () => {
    const { store, a, id } = await matched();
    await expect(sendMessage(store, a, id, "call me 9876543210", {}, NOW + 1000)).rejects.toMatchObject({ code: "confirm_contact" });
    await expect(sendMessage(store, a, id, "call me 9876543210", { confirm: true }, NOW + 1000)).resolves.toBeDefined();
  });

  it("warns the receiver about money requests and auto-reports after 3 strikes", async () => {
    const { store, a, b, id } = await matched();
    const asks = ["can you send 5000 rs", "my UPI is rk@ybl", "invest in this crypto app for guaranteed returns"];
    for (const [i, t] of asks.entries()) await sendMessage(store, await fresh(store, a), id, t, { confirm: true }, NOW + (i + 1) * 1000);
    const convo = await getConversation(store, b, id, NOW + 10_000);
    expect(convo.messages.filter((m) => m.tip?.includes("Never send money"))).toHaveLength(3);
    // The sender never sees the tip on their own messages.
    expect((await getConversation(store, a, id, NOW + 10_000)).messages.some((m) => m.tip)).toBe(false);
    const reports = await store.query<Report>("reports", [["reported", "==", a.id]]);
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({ reporter: "system", category: "scam_or_money" });
  });

  it("closes kindly with a template and frees the slot", async () => {
    const { store, a, b, id } = await matched();
    await closeMatch(store, a, id, "kindly", 1, NOW + 1000);
    const forB = await listMatches(store, b, NOW + 2000);
    expect(forB.slots.used).toBe(0);
    expect(forB.closed[0].closeReason).toBe("kindly");
    const convo = await getConversation(store, b, id, NOW + 2000);
    expect(convo.messages.at(-1)!.text).toMatch(/closed this conversation kindly/);
    await expect(sendMessage(store, b, id, "wait!", {}, NOW + 3000)).rejects.toMatchObject({ code: "closed" });
  });

  it("expires conversations idle for 7 days", async () => {
    const { store, a, id } = await matched();
    const later = NOW + 7 * 24 * HOUR + 1;
    const list = await listMatches(store, a, later);
    expect(list.active).toHaveLength(0);
    expect(list.closed[0].closeReason).toBe("expired");
    expect((await store.get<Match>("matches", id))!.status).toBe("expired");
  });
});

describe("Spark", () => {
  it("gives each player their own half and lets either one solve it", async () => {
    const { store, a, b, id } = await matched();
    const puzzleId = await startSpark(store, a, id, NOW + 1000);
    const viewA = (await getConversation(store, a, id, NOW + 2000)).spark!;
    const viewB = (await getConversation(store, b, id, NOW + 2000)).spark!;
    expect(viewA.role).toBe("A");
    expect(viewB.role).toBe("B");
    expect(viewA.puzzle.clues).not.toEqual(viewB.puzzle.clues);
    expect(viewA.answer).toBeUndefined();

    expect(await submitSpark(store, b, id, "nope", NOW + 3000)).toEqual({ correct: false, attempts: 1 });
    const answer = String(getPuzzle(puzzleId)!.answer);
    expect(await submitSpark(store, b, id, answer, NOW + 4 * 60_000)).toMatchObject({ correct: true });
    const after = await getConversation(store, a, id, NOW + 5 * 60_000);
    expect(after.spark!.solved).toBe(true);
    expect(after.messages.at(-1)!.text).toMatch(/Solved together in 4 mins \(after 1 wrong guess\)/);
    // A second Spark picks a different puzzle.
    const next = await startSpark(store, a, id, NOW + 6 * 60_000);
    expect(next).not.toBe(puzzleId);
  });
});

describe("date plan", () => {
  it("needs mutual consent, then propose → accept → share link → check-in", async () => {
    const { store, a, b, id } = await matched();
    const at = Date.parse("2026-11-21T12:30:00Z"); // Sat 6 PM IST
    await expect(proposeDate(store, a, id, { venueId: "blr-dicedeck", at }, NOW)).rejects.toMatchObject({ code: "not_ready" });
    await setMeetReady(store, a, id, true, NOW);
    expect((await setMeetReady(store, b, id, true, NOW)).both).toBe(true);

    await expect(proposeDate(store, a, id, { venueId: "blr-dicedeck", at: Date.parse("2026-11-21T18:00:00Z") }, NOW)).rejects.toMatchObject({ code: "late_hour" });
    await proposeDate(store, a, id, { venueId: "blr-dicedeck", at }, NOW);
    await expect(respondToDate(store, a, id, true, NOW)).rejects.toThrow();
    await respondToDate(store, b, id, true, NOW);

    const { token } = await createShareLink(store, b, id, NOW);
    const shared = await readShareLink(store, token, NOW);
    expect(shared).toMatchObject({ sharer: b.profile!.firstName, venue: { name: "Dice & Deck" } });
    expect(JSON.stringify(shared)).not.toContain(a.email);
    await expect(readShareLink(store, token, at + 25 * HOUR)).rejects.toThrow(/expired/);

    await expect(checkIn(store, b, id, { safe: true, again: "yes" }, NOW)).rejects.toThrow(/after your date/);
    await checkIn(store, b, id, { safe: false, again: "no", details: "Was pushy about drinks" }, at + 3 * HOUR);
    const reports = await store.query<Report>("reports", [["reported", "==", a.id]]);
    expect(reports[0]).toMatchObject({ category: "offline_behaviour", reporter: b.id });
  });
});

describe("moderation", () => {
  it("report blocks immediately, three reporters hide the profile, admin resolves", async () => {
    const store = new MemoryStore();
    const bad = man();
    const reporters = [woman(), woman(), woman()];
    const admin = makeUser({ role: "admin" });
    for (const u of [bad, admin, ...reporters]) await store.set("users", u.id, u);
    for (const r of reporters) await fileReport(store, r, { reported: bad.id, category: "harassment" }, NOW);
    expect((await fresh(store, bad)).status).toBe("under_review");
    expect(await store.get("blocks", `${reporters[0].id}__${bad.id}`)).not.toBeNull();

    const queue = await listReports(store, admin);
    expect(queue).toHaveLength(3);
    await resolveReport(store, admin, queue[0].id, "suspended", NOW);
    expect((await fresh(store, bad)).status).toBe("suspended");
    await expect(listReports(store, reporters[0])).rejects.toThrow(/Admins only/);
  });
});

describe("Plus", () => {
  it("subscribes, cancels in one step, and keeps Plus until the period ends", async () => {
    const store = new MemoryStore();
    const u = man();
    await store.set("users", u.id, u);
    const { renewsAt } = await subscribe(store, u, "plus_monthly", NOW);
    let me = await fresh(store, u);
    expect(me.plan).toBe("plus");
    await cancel(store, me);
    me = await settlePlan(store, await fresh(store, u), NOW + 1000);
    expect(me.plan).toBe("plus");
    me = await settlePlan(store, await fresh(store, u), renewsAt + 1);
    expect(me.plan).toBe("free");
  });
});

describe("data rights", () => {
  it("exports my data and deletes my account for real", async () => {
    const { store, a, b, id } = await matched();
    await store.set("credentials", a.email, { email: a.email, uid: a.id, passwordHash: await hashPassword("monsoon2026") });
    await sendMessage(store, a, id, "Hello from a soon-to-leave member", {}, NOW + 1000);
    const data = await exportData(store, a);
    expect(data.messagesYouSent).toHaveLength(1);
    expect(JSON.stringify(data)).not.toContain("passwordHash");

    await expect(deleteAccount(store, a, "wrong-password1", NOW)).rejects.toThrow(/incorrect/);
    await deleteAccount(store, a, "monsoon2026", NOW + 2000);
    expect(await store.get("users", a.id)).toBeNull();
    expect(await store.get("credentials", a.email)).toBeNull();
    const msgs = await store.query<{ text: string }>("messages", [["matchId", "==", id]]);
    expect(msgs.some((m) => m.text.includes("soon-to-leave"))).toBe(false);
    expect((await store.get<Match>("matches", id))!.status).toBe("closed");
    void b;
  });
});
