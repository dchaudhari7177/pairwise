import { describe, expect, it } from "vitest";
import { assignArm, bucket, fnv1a, SPARK_NUDGE, SPARK_NUDGE_TEXT } from "@/lib/experiments";
import { like } from "@/lib/services/discovery";
import { computeMetrics } from "@/lib/services/metrics";
import { login } from "@/lib/services/users";
import { DEMO_PASSWORD, seedDemo } from "@/lib/seed";
import { normalCdf, normalQuantile, sampleSizePerArm, twoProportionTest, wilson } from "@/lib/stats";
import { MemoryStore } from "@/lib/store/memory";
import { istDay } from "@/lib/time";
import type { Message, PicksDoc } from "@/lib/types";
import { man, woman } from "./fixtures";

const NOW = Date.parse("2026-11-17T06:00:00Z");

describe("statistics", () => {
  it("normal CDF and quantile agree with standard tables", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normalCdf(-1.645)).toBeCloseTo(0.05, 3);
    expect(normalQuantile(0.975)).toBeCloseTo(1.959964, 5);
    expect(normalQuantile(0.8)).toBeCloseTo(0.841621, 5);
    expect(normalQuantile(0.01)).toBeCloseTo(-2.326348, 5);
    for (const p of [0.001, 0.2, 0.5, 0.9, 0.999]) expect(normalCdf(normalQuantile(p))).toBeCloseTo(p, 6);
  });

  it("Wilson interval matches a hand-checked value and stays inside [0, 1]", () => {
    const [lo, hi] = wilson(5, 10);
    expect(lo).toBeCloseTo(0.2366, 3);
    expect(hi).toBeCloseTo(0.7634, 3);
    expect(wilson(0, 10)[0]).toBe(0);
    expect(wilson(10, 10)[1]).toBe(1);
    expect(wilson(0, 0)).toEqual([0, 1]);
  });

  it("two-proportion z-test: textbook example, and undefined cases return null", () => {
    // 60/100 vs 45/100 → z ≈ 2.12, p ≈ 0.034
    const t = twoProportionTest(60, 100, 45, 100);
    expect(t.diff).toBeCloseTo(0.15, 6);
    expect(t.z).toBeCloseTo(2.124, 2);
    expect(t.p!).toBeCloseTo(0.0337, 3);
    expect(twoProportionTest(1, 0, 1, 5).p).toBeNull();
    expect(twoProportionTest(0, 10, 0, 10).p).toBeNull();
  });

  it("sample size grows as the effect we want to detect shrinks", () => {
    // Classic reference: 30% → 40% at α = 0.05, power 0.8 needs ≈ 356 per arm.
    const n = sampleSizePerArm(0.3, 0.1);
    expect(n).toBeGreaterThan(340);
    expect(n).toBeLessThan(370);
    expect(sampleSizePerArm(0.3, 0.05)).toBeGreaterThan(n * 3);
  });
});

describe("experiment assignment", () => {
  it("is deterministic and depends on the salt", () => {
    expect(fnv1a("")).toBe(0x811c9dc5);
    expect(fnv1a("a")).toBe(0xe40c292c);
    expect(assignArm(SPARK_NUDGE, "m_123")).toBe(assignArm(SPARK_NUDGE, "m_123"));
    const moved = Array.from({ length: 200 }, (_, i) => `m${i}`).filter((id) => bucket(SPARK_NUDGE, id) !== bucket({ salt: "spark_nudge_v2" }, id));
    expect(moved.length).toBe(200);
  });

  it("splits close to 50/50 over many units", () => {
    const n = 20000;
    let treated = 0;
    for (let i = 0; i < n; i++) if (assignArm(SPARK_NUDGE, `user_${i}__user_${i * 7 + 3}`) === "nudge") treated++;
    expect(Math.abs(treated / n - 0.5)).toBeLessThan(0.015);
  });

  it("new matches in the treatment arm get the Spark nudge, control matches don't", async () => {
    const seen = { nudge: 0, control: 0 };
    for (let i = 0; i < 12; i++) {
      const store = new MemoryStore();
      const m = man();
      const w = woman();
      for (const u of [m, w]) await store.set("users", u.id, u);
      const day = istDay(NOW);
      const picks: PicksDoc = { id: `${m.id}_${day}`, uid: m.id, day, picks: [{ uid: w.id, score: 70, reasons: [] }], createdAt: NOW };
      await store.set("picks", picks.id, picks);
      await like(store, m, w.id, {}, NOW);
      const r = (await like(store, w, m.id, {}, NOW + 1000)) as { matchId: string };
      const msgs = await store.query<Message>("messages", [["matchId", "==", r.matchId]]);
      const nudged = msgs.some((x) => x.text === SPARK_NUDGE_TEXT);
      const arm = assignArm(SPARK_NUDGE, r.matchId);
      expect(nudged).toBe(arm === "nudge");
      seen[arm]++;
    }
    expect(seen.nudge).toBeGreaterThan(0);
    expect(seen.control).toBeGreaterThan(0);
  });

  it("the founder console reads the experiment out honestly", async () => {
    const store = new MemoryStore();
    await seedDemo(store, NOW);
    const admin = await login(store, "admin@pairwise.demo", DEMO_PASSWORD);
    const { experiment: e, cohorts } = await computeMetrics(store, admin, NOW);
    expect(e.control.n + e.treatment.n).toBeGreaterThan(10);
    expect(e.control.n).toBeGreaterThan(0);
    expect(e.treatment.n).toBeGreaterThan(0);
    // Pilot-sized data can't be conclusive, and the console must say so.
    expect(e.needPerArm).toBeGreaterThan(Math.min(e.control.n, e.treatment.n));
    expect(e.verdict.status).toBe("running");
    for (const a of [e.control, e.treatment]) {
      expect(a.ci[0]).toBeLessThanOrEqual(a.rate);
      expect(a.ci[1]).toBeGreaterThanOrEqual(a.rate);
    }
    // Retention: W0 is everyone (joining counts), later weeks never exceed the cohort.
    expect(cohorts.length).toBeGreaterThan(0);
    for (const c of cohorts) {
      if (c.weeks[0]) expect(c.weeks[0].rate).toBe(100);
      for (const w of c.weeks) if (w) expect(w.active).toBeLessThanOrEqual(w.eligible);
    }
  });
});
