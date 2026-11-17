import { describe, expect, it } from "vitest";
import { listActivity, markActivitySeen } from "@/lib/services/activity";
import { like } from "@/lib/services/discovery";
import { blockUser } from "@/lib/services/moderation";
import { proposeDate, respondToDate } from "@/lib/services/dates";
import { login } from "@/lib/services/users";
import { DEMO_PASSWORD, seedDemo } from "@/lib/seed";
import { MemoryStore } from "@/lib/store/memory";
import { istDay } from "@/lib/time";
import type { Match, PicksDoc, User } from "@/lib/types";
import { venuesFor } from "@/lib/venues";
import { man, woman } from "./fixtures";

const NOW = Date.parse("2026-11-17T06:00:00Z");
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

async function pair() {
  const store = new MemoryStore();
  const m = man();
  const w = woman();
  for (const u of [m, w]) await store.set("users", u.id, u);
  const day = istDay(NOW);
  const picks: PicksDoc = { id: `${m.id}_${day}`, uid: m.id, day, picks: [{ uid: w.id, score: 70, reasons: [] }], createdAt: NOW };
  await store.set("picks", picks.id, picks);
  return { store, m, w };
}
const fresh = async (store: MemoryStore, u: User) => (await store.get<User>("users", u.id))!;

describe("activity feed", () => {
  it("shows a delivered like, then replaces it with the match", async () => {
    const { store, m, w } = await pair();
    await like(store, m, w.id, { note: "Hello from the test" }, NOW);
    let feed = await listActivity(store, w, NOW + 1000);
    expect(feed.items.map((i) => i.kind)).toEqual(["like"]);
    expect(feed.items[0].detail).toContain("Hello from the test");
    expect(feed.unseen).toBe(1);

    await like(store, w, m.id, {}, NOW + 2000);
    feed = await listActivity(store, await fresh(store, w), NOW + 3000);
    expect(feed.items.map((i) => i.kind)).toEqual(["match"]);
    expect(feed.items[0].href).toMatch(/^\/chats\//);
  });

  it("never reveals likes still queued by the inbound cap", async () => {
    const { store, m, w } = await pair();
    await store.set("likes", `${m.id}__${w.id}`, { id: `${m.id}__${w.id}`, from: m.id, to: w.id, createdAt: NOW, deliverAt: NOW + DAY, deliverDay: istDay(NOW + DAY), status: "pending" });
    expect((await listActivity(store, w, NOW)).items).toHaveLength(0);
    expect((await listActivity(store, w, NOW + DAY + 1)).items).toHaveLength(1);
  });

  it("tells the proposer when a date is accepted, and marks items seen", async () => {
    const { store, m, w } = await pair();
    await like(store, m, w.id, {}, NOW);
    const { matchId } = (await like(store, w, m.id, {}, NOW + 1000)) as { matchId: string };
    await store.update("matches", matchId, { meetReady: { [m.id]: true, [w.id]: true } } satisfies Partial<Match>);
    const venue = venuesFor("bengaluru")[0];
    await proposeDate(store, m, matchId, { venueId: venue.id, at: NOW + 3 * DAY }, NOW + HOUR);

    const forHer = await listActivity(store, w, NOW + 2 * HOUR);
    expect(forHer.items[0]).toMatchObject({ kind: "date_proposed", at: NOW + HOUR });

    await respondToDate(store, w, matchId, true, NOW + 3 * HOUR);
    const forHim = await listActivity(store, m, NOW + 4 * HOUR);
    expect(forHim.items[0]).toMatchObject({ kind: "date_accepted", at: NOW + 3 * HOUR });
    expect(forHim.unseen).toBeGreaterThan(0);

    await markActivitySeen(store, m, NOW + 4 * HOUR);
    expect((await listActivity(store, await fresh(store, m), NOW + 5 * HOUR)).unseen).toBe(0);
  });

  it("hides people you've blocked", async () => {
    const { store, m, w } = await pair();
    await like(store, m, w.id, {}, NOW);
    await blockUser(store, w, m.id, NOW + 1000);
    expect((await listActivity(store, w, NOW + 2000)).items).toHaveLength(0);
  });

  it("demo accounts open with something new", async () => {
    const store = new MemoryStore();
    await seedDemo(store, NOW);
    const aarav = await login(store, "aarav@pairwise.demo", DEMO_PASSWORD);
    const feed = await listActivity(store, aarav, NOW);
    expect(feed.unseen).toBeGreaterThan(0);
    expect(feed.items.some((i) => i.kind === "date_proposed")).toBe(true);
    expect(feed.items.some((i) => i.kind === "spark_started")).toBe(true);
  });
});
