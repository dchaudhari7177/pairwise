import { describe, expect, it } from "vitest";
import { admitNextBatch, cityLaunch, decide, launchStats, LAUNCH, myVouches, redeemVouch, waitlistView } from "@/lib/services/launch";
import { saveProfile, type ProfileInput } from "@/lib/services/users";
import { MemoryStore } from "@/lib/store/memory";
import type { User } from "@/lib/types";
import { makeUser, man, woman } from "./fixtures";

const NOW = Date.parse("2026-11-18T06:00:00Z");

async function storeWith(users: User[]) {
  const store = new MemoryStore();
  for (const u of users) await store.set("users", u.id, u);
  return store;
}

const waiting = (u: User, reason: "balance" | "city_closed", joinedAt: number): User => ({
  ...u,
  status: "waitlisted",
  waitlist: { city: u.profile!.city, reason, joinedAt },
});

function input(u: User): ProfileInput {
  const p = u.profile!;
  return {
    ...p,
    prompts: [
      { q: "A", a: "one" },
      { q: "B", a: "two" },
      { q: "C", a: "three" },
    ],
  } as ProfileInput;
}

describe("admission rule", () => {
  const balanced = { women: 4, gatedMen: 5 };

  it("waitlists everyone in a city that isn't open, women included", () => {
    expect(decide({ gender: "woman", interestedIn: ["man"], city: "chennai" }, balanced, 0)).toEqual({ status: "waitlisted", reason: "city_closed" });
  });

  it("lets women and men not seeking women straight in", () => {
    expect(decide({ gender: "woman", interestedIn: ["man"], city: "bengaluru" }, { women: 0, gatedMen: 50 }, 9).status).toBe("active");
    expect(decide({ gender: "man", interestedIn: ["man"], city: "bengaluru" }, { women: 0, gatedMen: 50 }, 9).status).toBe("active");
  });

  it("admits a man seeking women only if women stay at 40% or more afterwards", () => {
    // 4 / (4 + 6) = 40%: in.
    expect(decide({ gender: "man", interestedIn: ["woman"], city: "bengaluru" }, balanced, 0).status).toBe("active");
    // 4 / (4 + 7) = 36%: wait.
    expect(decide({ gender: "man", interestedIn: ["woman"], city: "bengaluru" }, { women: 4, gatedMen: 6 }, 0)).toEqual({ status: "waitlisted", reason: "balance" });
  });

  it("never lets a newcomer jump a queue that already exists", () => {
    expect(decide({ gender: "man", interestedIn: ["woman"], city: "bengaluru" }, { women: 50, gatedMen: 1 }, 1).status).toBe("waitlisted");
  });
});

describe("onboarding goes through the gate", () => {
  it("a man finishing his profile in a tipped city lands on the waitlist", async () => {
    const store = await storeWith([woman({ id: "w1" }), man({ id: "m1" }), man({ id: "m2" })]);
    const newcomer = man({ id: "m3", onboarded: false });
    await store.set("users", newcomer.id, newcomer);
    const { admission } = await saveProfile(store, newcomer, input(newcomer));
    expect(admission).toEqual({ status: "waitlisted", reason: "balance" });
    const saved = (await store.get<User>("users", "m3"))!;
    expect(saved.status).toBe("waitlisted");
    expect(saved.waitlist).toMatchObject({ city: "bengaluru", reason: "balance" });
  });

  it("editing a profile later never re-gates an active member", async () => {
    const store = await storeWith([woman({ id: "w1" }), man({ id: "m1" }), man({ id: "m2" }), man({ id: "m3" })]);
    const m3 = (await store.get<User>("users", "m3"))!;
    const { admission } = await saveProfile(store, m3, input(m3));
    expect(admission).toBeNull();
    expect((await store.get<User>("users", "m3"))!.status).toBe("active");
  });

  it("a waitlisted member who moves to an open, balanced city is let in", async () => {
    const store = await storeWith([woman({ id: "w1" }, { city: "pune" })]);
    const m = waiting(man({ id: "m1" }, { city: "chennai" }), "city_closed", NOW);
    await store.set("users", m.id, m);
    await saveProfile(store, m, { ...input(m), city: "pune" });
    const saved = (await store.get<User>("users", "m1"))!;
    expect(saved.status).toBe("active");
    expect(saved.waitlist).toBeUndefined();
  });
});

describe("waitlist and launch board", () => {
  it("shows a member their place in line and their city's progress", async () => {
    const store = await storeWith([
      waiting(woman({ id: "w1" }, { city: "chennai" }), "city_closed", NOW - 3000),
      waiting(man({ id: "m1" }, { city: "chennai" }), "city_closed", NOW - 2000),
      waiting(man({ id: "m2" }, { city: "chennai" }), "city_closed", NOW - 1000),
    ]);
    const m2 = (await store.get<User>("users", "m2"))!;
    const view = (await waitlistView(store, m2))!;
    expect(view.position).toBe(3);
    expect(view.city).toMatchObject({ open: false, verified: 3, womenShare: 33, ready: false });
  });

  it("counts liquidity the way the GTM plan does", () => {
    const active = Array.from({ length: LAUNCH.minVerified }, (_, i) => (i % 2 ? man() : woman()));
    const s = launchStats("bengaluru", active, []);
    expect(s.pool).toBe(240);
    expect(s.daysOfPicks).toBe(48);
    expect(s.ready).toBe(true);
  });

  it("admits women first, then men only while the balance holds", async () => {
    const store = await storeWith([
      woman({ id: "w1" }),
      man({ id: "m1" }),
      waiting(man({ id: "q1" }), "balance", NOW - 3000),
      waiting(man({ id: "q2" }), "balance", NOW - 2000),
      waiting(woman({ id: "q3" }), "city_closed", NOW - 1000),
    ]);
    // After q3: 2 women, 1 man. q1 → 2/4 = 50% in; q2 → 2/5 = 40% in.
    expect(await admitNextBatch(store, "bengaluru", NOW)).toEqual({ admitted: 3, stillWaiting: 0 });
    const s = await cityLaunch(store, "bengaluru");
    expect(s).toMatchObject({ active: 5, womenShare: 40 });
  });

  it("stops at the first man who would tip the balance", async () => {
    const store = await storeWith([woman({ id: "w1" }), woman({ id: "w2" }), man({ id: "m1" }), man({ id: "m2" }), waiting(man({ id: "q1" }), "balance", NOW - 2000), waiting(man({ id: "q2" }), "balance", NOW - 1000)]);
    expect(await admitNextBatch(store, "bengaluru", NOW)).toEqual({ admitted: 1, stillWaiting: 1 });
    expect((await store.get<User>("users", "q1"))!.status).toBe("active");
    expect((await store.get<User>("users", "q2"))!.status).toBe("waitlisted");
  });

  it("refuses to admit anyone into a closed city", async () => {
    const store = await storeWith([]);
    await expect(admitNextBatch(store, "mumbai", NOW)).rejects.toThrow(/isn't open yet/);
  });
});

describe("vouches", () => {
  it("gives each verified member three single-use codes, stable across visits", async () => {
    const asha = woman({ id: "asha" }, { firstName: "Asha" });
    const store = await storeWith([asha]);
    const first = await myVouches(store, asha, NOW);
    expect(first).toHaveLength(3);
    for (const v of first) expect(v.id).toMatch(/^ASHA-[A-Z2-9]{4}$/);
    expect((await myVouches(store, asha, NOW)).map((v) => v.id)).toEqual(first.map((v) => v.id));
  });

  it("people who can't vouch get no codes", async () => {
    const store = await storeWith([]);
    expect(await myVouches(store, waiting(man(), "balance", NOW), NOW)).toEqual([]);
    expect(await myVouches(store, makeUser({ verification: { method: null, identity: false } }), NOW)).toEqual([]);
  });

  it("a vouch lets someone skip the balance queue, once", async () => {
    const asha = woman({ id: "asha" }, { firstName: "Asha" });
    const q1 = waiting(man({ id: "q1" }), "balance", NOW);
    const q2 = waiting(man({ id: "q2" }), "balance", NOW);
    const store = await storeWith([asha, q1, q2]);
    const [code] = await myVouches(store, asha, NOW);
    expect(await redeemVouch(store, q1, code.id.toLowerCase(), NOW)).toEqual({ admitted: true, voucher: "Asha" });
    expect((await store.get<User>("users", "q1"))).toMatchObject({ status: "active", vouchedBy: "asha" });
    await expect(redeemVouch(store, q2, code.id, NOW)).rejects.toThrow(/already been used/);
  });

  it("a vouch can't open a closed city, but moves you to the front", async () => {
    const asha = woman({ id: "asha" }, { firstName: "Asha" });
    const early = waiting(woman({ id: "early" }, { city: "mumbai" }), "city_closed", NOW - 5000);
    const late = waiting(man({ id: "late" }, { city: "mumbai" }), "city_closed", NOW);
    const store = await storeWith([asha, early, late]);
    const [code] = await myVouches(store, asha, NOW);
    expect(await redeemVouch(store, late, code.id, NOW)).toEqual({ admitted: false, voucher: "Asha" });
    const saved = (await store.get<User>("users", "late"))!;
    expect(saved.status).toBe("waitlisted");
    expect((await waitlistView(store, saved))!.position).toBe(1);
  });

  it("rejects bad codes and self-vouching", async () => {
    const q = waiting(man({ id: "q" }, { firstName: "Quinn" }), "balance", NOW);
    const store = await storeWith([q]);
    await expect(redeemVouch(store, q, "nope", NOW)).rejects.toThrow(/doesn't look like/);
    await expect(redeemVouch(store, q, "ZZZ-AAAA", NOW)).rejects.toThrow(/couldn't find/);
    await expect(redeemVouch(store, woman(), "ZZZ-AAAA", NOW)).rejects.toThrow(/already in/);
  });
});
