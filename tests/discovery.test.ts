import { describe, expect, it } from "vitest";
import { like, likesReceived, pass, todaysPicks } from "@/lib/services/discovery";
import { MemoryStore } from "@/lib/store/memory";
import type { PicksDoc, User } from "@/lib/types";
import { istDay } from "@/lib/time";
import { man, woman } from "./fixtures";

const NOW = Date.parse("2026-11-17T06:00:00Z");

async function setup(...users: User[]) {
  const store = new MemoryStore();
  for (const u of users) await store.set("users", u.id, u);
  return store;
}

/** Put `targets` into the viewer's picks for today. */
async function givePicks(store: MemoryStore, viewer: User, targets: User[], now = NOW) {
  const day = istDay(now);
  const doc: PicksDoc = { id: `${viewer.id}_${day}`, uid: viewer.id, day, picks: targets.map((t) => ({ uid: t.id, score: 70, reasons: [] })), createdAt: now };
  await store.set("picks", doc.id, doc);
}

describe("likes and matches", () => {
  it("creates a match when the like is mutual", async () => {
    const m = man();
    const w = woman();
    const store = await setup(m, w);
    await givePicks(store, m, [w]);
    expect(await like(store, m, w.id, { note: "Your Sunday sounds perfect", promptIndex: undefined }, NOW)).toEqual({ matched: false, queued: false });

    const received = await likesReceived(store, w, NOW);
    expect(received.likes.map((l) => l.card.id)).toEqual([m.id]);
    expect(received.likes[0].note).toBe("Your Sunday sounds perfect");

    const result = await like(store, w, m.id, {}, NOW + 1000);
    expect(result).toMatchObject({ matched: true });
    const match = await store.get<{ status: string; members: string[] }>("matches", (result as { matchId: string }).matchId);
    expect(match).toMatchObject({ status: "active" });
    const msgs = await store.query<{ text: string }>("messages", [["matchId", "==", (result as { matchId: string }).matchId]]);
    expect(msgs[0].text).toContain("Your Sunday sounds perfect");
  });

  it("only allows liking people from today's picks (or who liked you)", async () => {
    const m = man();
    const w = woman();
    const store = await setup(m, w);
    await expect(like(store, m, w.id, {}, NOW)).rejects.toMatchObject({ code: "not_in_picks" });
  });

  it("caps inbound likes at 10 a day and queues the rest for a later day", async () => {
    const w = woman();
    const men = Array.from({ length: 12 }, () => man());
    const store = await setup(w, ...men);
    for (const m of men) {
      await givePicks(store, m, [w]);
      await like(store, m, w.id, {}, NOW);
    }
    const received = await likesReceived(store, w, NOW);
    expect(received.likes).toHaveLength(10);
    expect(received.queued).toBe(2);
    // The next day, the queued ones arrive.
    const tomorrow = await likesReceived(store, w, NOW + 26 * 3600 * 1000);
    expect(tomorrow.likes).toHaveLength(12);
  });

  it("blocks new likes when all conversation slots are full", async () => {
    const m = man();
    const ws = Array.from({ length: 4 }, () => woman());
    const store = await setup(m, ...ws);
    for (let i = 0; i < 3; i++) {
      await store.set("matches", `x${i}`, { id: `x${i}`, members: [m.id, ws[i].id], status: "active", messageCounts: {}, unread: {}, meetReady: {}, createdAt: NOW });
    }
    await givePicks(store, m, [ws[3]]);
    await expect(like(store, m, ws[3].id, {}, NOW)).rejects.toMatchObject({ code: "slots_full" });
  });

  it("quietly closes a pending like when the recipient passes", async () => {
    const m = man();
    const w = woman();
    const store = await setup(m, w);
    await givePicks(store, m, [w]);
    await like(store, m, w.id, {}, NOW);
    await pass(store, w, m.id, NOW);
    expect((await likesReceived(store, w, NOW)).likes).toHaveLength(0);
    expect((await store.get<{ status: string }>("likes", `${m.id}__${w.id}`))!.status).toBe("passed");
  });

  it("rejects notes that ask for money", async () => {
    const m = man();
    const w = woman();
    const store = await setup(m, w);
    await givePicks(store, m, [w]);
    await expect(like(store, m, w.id, { note: "send 5000 rs pls" }, NOW)).rejects.toMatchObject({ code: "note_blocked" });
  });

  it("refuses unverified members", async () => {
    const m = man({ verification: { method: null, identity: false } });
    const w = woman();
    const store = await setup(m, w);
    await expect(like(store, m, w.id, {}, NOW)).rejects.toMatchObject({ code: "not_verified" });
  });
});

describe("today's picks", () => {
  it("computes once per day, caches, and drops people as you act on them", async () => {
    const m = man();
    const ws = Array.from({ length: 8 }, () => woman());
    const store = await setup(m, ...ws);
    const first = await todaysPicks(store, m, NOW);
    expect(first.picks).toHaveLength(5);
    expect(first.limit).toBe(5);
    await pass(store, m, first.picks[0].card.id, NOW);
    const second = await todaysPicks(store, m, NOW + 60000);
    expect(second.picks).toHaveLength(4);
    expect(second.acted).toBe(1);
    // Exposure counters were bumped for the people shown.
    const shown = await store.get<User>("users", first.picks[1].card.id);
    expect(shown!.exposure.count).toBe(1);
  });

  it("gives Plus members 10 picks", async () => {
    const m = man({ plan: "plus" });
    const ws = Array.from({ length: 12 }, () => woman());
    const store = await setup(m, ...ws);
    expect((await todaysPicks(store, m, NOW)).picks).toHaveLength(10);
  });
});
