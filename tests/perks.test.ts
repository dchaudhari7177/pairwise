import { describe, expect, it } from "vitest";
import { proposeDate, respondToDate, setMeetReady } from "@/lib/services/dates";
import { getConversation } from "@/lib/services/matches";
import { inWindow, newPerkCode, redeemPerk } from "@/lib/services/perks";
import { MemoryStore } from "@/lib/store/memory";
import type { Match, Redemption } from "@/lib/types";
import { man, woman } from "./fixtures";

const NOW = Date.parse("2026-11-17T06:00:00Z");
const HOUR = 3600 * 1000;
const SAT_6PM = Date.parse("2026-11-21T12:30:00Z");

async function dateAt(venueId: string) {
  const store = new MemoryStore();
  const a = man();
  const b = woman();
  for (const u of [a, b]) await store.set("users", u.id, u);
  const id = [a.id, b.id].sort().join("__");
  const match: Match = { id, members: [a.id, b.id].sort() as [string, string], createdAt: NOW, status: "active", messageCounts: {}, unread: {}, meetReady: {}, lastMessageAt: NOW };
  await store.set("matches", id, match);
  await setMeetReady(store, a, id, true, NOW);
  await setMeetReady(store, b, id, true, NOW);
  await proposeDate(store, a, id, { venueId, at: SAT_6PM }, NOW);
  await respondToDate(store, b, id, true, NOW + HOUR);
  const convo = await getConversation(store, a, id, NOW + HOUR);
  return { store, a, b, id, code: convo.datePlan?.perkCode };
}

describe("partner perks", () => {
  it("codes are PW- plus six unambiguous characters", () => {
    expect(newPerkCode(Buffer.from([0, 1, 2, 3, 4, 5]))).toBe("PW-ABCDEF");
    for (let i = 0; i < 50; i++) expect(newPerkCode()).toMatch(/^PW-[A-HJ-NP-Z2-9]{6}$/);
  });

  it("accepting a date at a partner venue issues one code and tells both people", async () => {
    const { store, a, id, code } = await dateAt("blr-dicedeck");
    expect(code).toMatch(/^PW-/);
    const r = (await store.get<Redemption>("redemptions", code!))!;
    expect(r).toMatchObject({ matchId: id, venueId: "blr-dicedeck", at: SAT_6PM });
    const convo = await getConversation(store, a, id, NOW + HOUR);
    expect(convo.messages.at(-1)!.text).toContain(code!);
  });

  it("non-partner venues (a park walk) get no code", async () => {
    const { code } = await dateAt("blr-cubbon");
    expect(code).toBeUndefined();
  });

  it("the venue redeems it once, on the day, and is billed", async () => {
    const { store, code } = await dateAt("blr-dicedeck");
    await expect(redeemPerk(store, "blr-dicedeck", code!, NOW)).rejects.toThrow(/day of the date/);
    const morning = SAT_6PM - 8 * HOUR;
    expect(await redeemPerk(store, "blr-dicedeck", code!.toLowerCase(), morning)).toMatchObject({ ok: true, venue: "Dice & Deck", feeInr: 50 });
    await expect(redeemPerk(store, "blr-dicedeck", code!, morning)).rejects.toThrow(/already been used/);
  });

  it("a code only works at its own venue, and not long after the date", async () => {
    const { store, code } = await dateAt("blr-dicedeck");
    await expect(redeemPerk(store, "blr-filterhouse", code!, SAT_6PM)).rejects.toThrow(/for Dice & Deck/);
    await expect(redeemPerk(store, "blr-dicedeck", code!, SAT_6PM + 30 * HOUR)).rejects.toThrow(/expired/);
    await expect(redeemPerk(store, "blr-dicedeck", "hello", SAT_6PM)).rejects.toThrow(/look like/);
  });

  it("a cancelled date's code stops working", async () => {
    const { store, id, code } = await dateAt("blr-dicedeck");
    await store.update("matches", id, { status: "closed" });
    await expect(redeemPerk(store, "blr-dicedeck", code!, SAT_6PM)).rejects.toThrow(/changed or cancelled/);
  });

  it("the window is the IST day of the date plus 24 hours after", () => {
    expect(inWindow(SAT_6PM, SAT_6PM - 12 * HOUR)).toBe(true); // 6 AM IST the same day
    expect(inWindow(SAT_6PM, SAT_6PM - 19 * HOUR)).toBe(false); // 11 PM IST the night before
    expect(inWindow(SAT_6PM, SAT_6PM + 23 * HOUR)).toBe(true);
  });
});

describe("venue applications", () => {
  const base = {
    name: "Chai Point Social",
    city: "bengaluru" as const,
    area: "Jayanagar",
    kind: "Café",
    contactName: "Rekha S",
    contactEmail: "rekha@chaipoint.test",
    perk: "Free biscuits with two chais",
    checklist: { public: true, transit: true, staffBriefed: true, openLate: false },
  };

  it("accepts venues that pass the safety checklist", async () => {
    const { applyAsVenue, listApplications } = await import("@/lib/services/perks");
    const store = new MemoryStore();
    await applyAsVenue(store, base, NOW);
    expect(await listApplications(store)).toMatchObject([{ name: "Chai Point Social", status: "new" }]);
  });

  it("says no up front to venues that can't keep a first date safe", async () => {
    const { applyAsVenue } = await import("@/lib/services/perks");
    const store = new MemoryStore();
    await expect(applyAsVenue(store, { ...base, checklist: { ...base.checklist, staffBriefed: false } }, NOW)).rejects.toThrow(/required/);
  });

  it("bills listings plus redemptions in the last 30 days", async () => {
    const { venueRevenue } = await import("@/lib/services/perks");
    const { store, code } = await dateAt("blr-dicedeck");
    await redeemPerk(store, "blr-dicedeck", code!, SAT_6PM);
    const r = await venueRevenue(store, SAT_6PM + HOUR);
    expect(r).toMatchObject({ issued: 1, redeemed30: 1, perRedemption: 50 });
    expect(r.listing).toBe(r.partners * 3000);
  });
});
