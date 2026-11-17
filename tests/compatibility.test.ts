import { describe, expect, it } from "vitest";
import { assess } from "@/lib/matching/compatibility";
import { man, woman } from "./fixtures";

const NOW = Date.parse("2026-11-17T06:00:00Z");

describe("hard filters", () => {
  it("passes a compatible pair with no blockers", () => {
    expect(assess(man(), woman(), { now: NOW }).blockers).toEqual([]);
  });

  it("requires orientation to match in both directions", () => {
    const m = man();
    const w = woman({}, { interestedIn: ["woman"] });
    expect(assess(m, w, { now: NOW }).blockers).toContain("orientation");
    expect(assess(w, m, { now: NOW }).blockers).toContain("orientation");
  });

  it("supports same-gender and non-binary preferences", () => {
    const a = woman({}, { interestedIn: ["woman", "nonbinary"] });
    const b = woman({}, { interestedIn: ["woman"] });
    expect(assess(a, b, { now: NOW }).blockers).toEqual([]);
  });

  it("checks both people's age ranges", () => {
    const m = man({}, { birthDate: "1994-01-01" }); // 32
    const w = woman({}, { ageRange: [23, 30] });
    expect(assess(m, w, { now: NOW }).blockers).toContain("age");
  });

  it("keeps people in their own city unless Plus travel mode is on", () => {
    const m = man({}, { city: "pune" });
    const w = woman();
    expect(assess(m, w, { now: NOW }).blockers).toContain("city");
    const traveller = man({ plan: "plus", travelCity: "bengaluru" }, { city: "pune" });
    expect(assess(traveller, w, { now: NOW }).blockers).not.toContain("city");
    // travel mode does nothing without Plus
    const lapsed = man({ plan: "free", travelCity: "bengaluru" }, { city: "pune" });
    expect(assess(lapsed, w, { now: NOW }).blockers).toContain("city");
  });

  it("treats 'figuring it out' vs 'marriage-minded' and kids want/don't want as dealbreakers", () => {
    expect(assess(man({}, { intent: "figuring_out" }), woman({}, { intent: "marriage" }), { now: NOW }).blockers).toContain("intent");
    const m = man({}, { lifePlan: { relocate: "yes", timeline: "2_4y", kids: "want", family: "open" } });
    const w = woman({}, { lifePlan: { relocate: "yes", timeline: "2_4y", kids: "dont_want", family: "open" } });
    expect(assess(m, w, { now: NOW }).blockers).toContain("kids");
  });

  it("walls off colleagues when EITHER person turns on hide-from-company", () => {
    const work = { employer: "Kaveri", domain: "kaveri.test" };
    const m = man({ verification: { method: "elitmus", identity: true, work } });
    const w = woman({ verification: { method: "elitmus", identity: true, work }, privacy: { hideFromCompany: true, hideFromCollege: false, blurPhotos: false } });
    expect(assess(m, w, { now: NOW }).blockers).toContain("same_company");
    expect(assess(w, m, { now: NOW }).blockers).toContain("same_company");
  });

  it("never shows unverified, paused or blocked members", () => {
    const m = man();
    expect(assess(m, woman({ verification: { method: null, identity: false } }), { now: NOW }).blockers).toContain("not_verified");
    expect(assess(m, woman({ status: "paused" }), { now: NOW }).blockers).toContain("not_active");
    const w = woman();
    expect(assess(m, w, { now: NOW, blocked: new Set([w.id]) }).blockers).toContain("blocked");
  });
});

describe("score and reasons", () => {
  it("is symmetric: A→B scores the same as B→A", () => {
    const m = man({}, { values: ["Honesty", "Family"], interests: ["Chess"] });
    const w = woman({}, { values: ["Family", "Growth"], interests: ["Chess", "Yoga"] });
    expect(assess(m, w, { now: NOW }).score).toBe(assess(w, m, { now: NOW }).score);
  });

  it("rewards shared values and life plans, and explains why", () => {
    const plan = { relocate: "yes", timeline: "within_2y", kids: "want", family: "joint" } as const;
    const m = man({}, { values: ["Honesty", "Family", "Faith"], interests: ["Cricket", "Cooking", "Travel"], lifePlan: plan, intent: "marriage", languages: ["English", "Hindi"] });
    const w = woman({}, { values: ["Honesty", "Family", "Faith"], interests: ["Cricket", "Cooking", "Travel"], lifePlan: plan, intent: "marriage", languages: ["English", "Hindi"] });
    const strong = assess(m, w, { now: NOW });
    const weak = assess(m, woman({}, { values: ["Adventure"], interests: ["Anime"], intent: "long_term" }), { now: NOW });
    expect(strong.score).toBeGreaterThan(weak.score + 30);
    expect(strong.score).toBeLessThanOrEqual(100);
    expect(strong.reasons.join(" | ")).toMatch(/value Honesty, Family and Faith/);
    expect(strong.reasons.length).toBeLessThanOrEqual(4);
  });

  it("puts a shared hometown first", () => {
    const r = assess(man({}, { hometown: "Hubballi" }), woman({}, { hometown: "Hubballi" }), { now: NOW });
    expect(r.reasons[0]).toBe("You're both from Hubballi");
  });
});
