import { describe, expect, it } from "vitest";
import { login, validateProfile } from "@/lib/services/users";
import { like, likesReceived, todaysPicks } from "@/lib/services/discovery";
import { getConversation, listMatches } from "@/lib/services/matches";
import { computeMetrics } from "@/lib/services/metrics";
import { DEMO_PASSWORD, seedDemo } from "@/lib/seed";
import { MemoryStore } from "@/lib/store/memory";
import type { User } from "@/lib/types";

const NOW = Date.parse("2026-11-17T06:00:00Z");

async function seeded() {
  const store = new MemoryStore();
  await seedDemo(store, NOW);
  return store;
}

describe("demo scenario", () => {
  it("every seeded profile passes the same validation as a real sign-up", async () => {
    const store = await seeded();
    const users = await store.query<User>("users", [["role", "==", "member"]]);
    expect(users.length).toBeGreaterThan(45);
    for (const u of users) expect(() => validateProfile(u.profile!), u.id).not.toThrow();
  });

  it("Aarav: picks, three likes, a date proposal and a half-done Spark", async () => {
    const store = await seeded();
    const aarav = await login(store, "aarav@pairwise.demo", DEMO_PASSWORD);
    const picks = await todaysPicks(store, aarav, NOW);
    expect(picks.picks).toHaveLength(5);
    expect((await likesReceived(store, aarav, NOW)).likes).toHaveLength(3);
    const list = await listMatches(store, aarav, NOW);
    expect(list.active).toHaveLength(2);
    expect(list.slots).toEqual({ used: 2, limit: 3 });
    const ishita = await getConversation(store, aarav, list.active.find((m) => m.other.firstName === "Ishita")!.id, NOW);
    expect(ishita.datePlan).toMatchObject({ status: "proposed", proposedByMe: false });
    const sneha = await getConversation(store, aarav, list.active.find((m) => m.other.firstName === "Sneha")!.id, NOW);
    expect(sneha.spark).toMatchObject({ role: "B", solved: false });
  });

  it("Meera: 10 likes now, 2 queued, Scam Shield tips, and her colleague is walled off", async () => {
    const store = await seeded();
    const meera = await login(store, "meera@pairwise.demo", DEMO_PASSWORD);
    const received = await likesReceived(store, meera, NOW);
    expect(received.likes).toHaveLength(10);
    expect(received.queued).toBe(2);
    const picks = await todaysPicks(store, meera, NOW);
    expect(picks.picks.map((p) => p.card.id)).not.toContain("s_rohan");
    const vik = (await listMatches(store, meera, NOW)).active.find((m) => m.other.firstName === "Vikram")!;
    const convo = await getConversation(store, meera, vik.id, NOW);
    expect(convo.messages.filter((m) => m.tip).length).toBeGreaterThanOrEqual(2);
    // She can like someone back and match instantly.
    const karthik = received.likes.find((l) => l.card.id === "s_karthik")!;
    expect(await like(store, meera, karthik.card.id, {}, NOW)).toMatchObject({ matched: true });
  });

  it("the founder dashboard has real signal", async () => {
    const store = await seeded();
    const admin = await login(store, "admin@pairwise.demo", DEMO_PASSWORD);
    const m = await computeMetrics(store, admin, NOW);
    expect(m.northStar.wmc).toBeGreaterThan(0);
    expect(m.safety.openReports).toBe(2);
    expect(m.revenue.plusMembers).toBe(4);
    expect(m.funnel[0].value).toBeGreaterThan(m.funnel.at(-1)!.value);
  });

  it("re-seeding with reset wipes demo-account activity and restores the story", async () => {
    const store = await seeded();
    const meera = await login(store, "meera@pairwise.demo", DEMO_PASSWORD);
    await like(store, meera, "s_karthik", {}, NOW);
    await seedDemo(store, NOW + 1000, { reset: true });
    const again = await login(store, "meera@pairwise.demo", DEMO_PASSWORD);
    expect((await likesReceived(store, again, NOW + 2000)).likes).toHaveLength(10);
    expect((await listMatches(store, again, NOW + 2000)).active).toHaveLength(1);
  });
});

describe("demo scenario: city launch gate", () => {
  it("Vivek waits third in Hyderabad's balance queue; Aarav's spare vouch lets him in", async () => {
    const { waitlistView, redeemVouch, myVouches } = await import("@/lib/services/launch");
    const { DEMO_VOUCH } = await import("@/lib/seed");
    const store = await seeded();
    const vivek = await login(store, "vivek@pairwise.demo", DEMO_PASSWORD);
    const view = (await waitlistView(store, vivek))!;
    expect(view).toMatchObject({ reason: "balance", position: 3 });
    expect(view.city).toMatchObject({ open: true, women: 3, gatedMen: 3, womenShare: 50, room: 1 });
    const aarav = await login(store, "aarav@pairwise.demo", DEMO_PASSWORD);
    expect((await myVouches(store, aarav, NOW)).map((v) => v.id)).toContain(DEMO_VOUCH);
    expect(await redeemVouch(store, vivek, DEMO_VOUCH, NOW)).toEqual({ admitted: true, voucher: "Aarav" });
  });

  it("the founder can admit exactly one more man from Hyderabad before the balance tips", async () => {
    const { admitNextBatch } = await import("@/lib/services/launch");
    const store = await seeded();
    expect(await admitNextBatch(store, "hyderabad", NOW)).toEqual({ admitted: 1, stillWaiting: 2 });
    expect((await store.get<User>("users", "s_naveen"))!.status).toBe("active");
  });

  it("waitlisted members never appear in anyone's picks", async () => {
    const store = await seeded();
    const swathi = (await store.get<User>("users", "s_swathi"))!;
    const picks = await todaysPicks(store, swathi, NOW);
    expect(picks.picks.map((p) => p.card.id)).not.toContain("s_vivek");
  });
});

describe("demo scenario: partner venues", () => {
  it("tonight's Dice & Deck code redeems today; past partner dates are already billed", async () => {
    const { redeemPerk, venueRevenue } = await import("@/lib/services/perks");
    const { DEMO_PERK } = await import("@/lib/seed");
    const store = await seeded();
    const before = await venueRevenue(store, NOW);
    expect(before.redeemed30).toBe(3);
    expect(await redeemPerk(store, "blr-dicedeck", DEMO_PERK, NOW)).toMatchObject({ ok: true, venue: "Dice & Deck" });
    expect((await venueRevenue(store, NOW)).redeemed30).toBe(4);
  });
});
