import { describe, expect, it } from "vitest";
import { attentionFactor, rankPicks } from "@/lib/matching/picks";
import { man, woman } from "./fixtures";

const NOW = Date.parse("2026-11-17T06:00:00Z");
const DAY = "2026-11-17";

describe("daily picks", () => {
  it("returns at most `count` picks, best first", () => {
    const viewer = man();
    const pool = Array.from({ length: 12 }, () => ({ user: woman(), pendingInbound: 0 }));
    const picks = rankPicks(viewer, pool, { count: 5, day: DAY, now: NOW });
    expect(picks).toHaveLength(5);
    for (let i = 1; i < picks.length; i++) expect(picks[i - 1].rank).toBeGreaterThanOrEqual(picks[i].rank);
  });

  it("balances attention: a flooded profile ranks below an equally compatible quiet one", () => {
    const viewer = man();
    const flooded = woman();
    const quiet = woman();
    const picks = rankPicks(
      viewer,
      [
        { user: flooded, pendingInbound: 60 },
        { user: quiet, pendingInbound: 0 },
      ],
      { count: 2, day: DAY, now: NOW },
    );
    expect(picks.map((p) => p.uid)).toEqual([quiet.id, flooded.id]);
    expect(attentionFactor(0)).toBe(1);
    expect(attentionFactor(8)).toBe(0.5);
  });

  it("skips excluded, blocked and incompatible people", () => {
    const viewer = man();
    const liked = woman();
    const blocked = woman();
    const otherCity = woman({}, { city: "pune" });
    const ok = woman();
    const picks = rankPicks(
      viewer,
      [liked, blocked, otherCity, ok].map((user) => ({ user, pendingInbound: 0 })),
      { count: 5, day: DAY, now: NOW, excluded: new Set([liked.id]), blocked: new Set([blocked.id]) },
    );
    expect(picks.map((p) => p.uid)).toEqual([ok.id]);
  });

  it("caps picks from a single employer at two", () => {
    const viewer = man();
    const work = { employer: "Kaveri", domain: "kaveri.test" };
    const colleagues = Array.from({ length: 4 }, () =>
      woman({ verification: { method: "elitmus", identity: true, work } }),
    );
    const others = Array.from({ length: 4 }, () => woman());
    const picks = rankPicks(
      viewer,
      [...colleagues, ...others].map((user) => ({ user, pendingInbound: 0 })),
      { count: 6, day: DAY, now: NOW },
    );
    const fromKaveri = picks.filter((p) => colleagues.some((c) => c.id === p.uid));
    expect(fromKaveri.length).toBeLessThanOrEqual(2);
    expect(picks).toHaveLength(6);
  });

  it("is deterministic for a given viewer and day", () => {
    const viewer = man();
    const pool = Array.from({ length: 10 }, () => ({ user: woman(), pendingInbound: 0 }));
    const a = rankPicks(viewer, pool, { count: 5, day: DAY, now: NOW }).map((p) => p.uid);
    const b = rankPicks(viewer, pool, { count: 5, day: DAY, now: NOW }).map((p) => p.uid);
    expect(a).toEqual(b);
  });

  it("prefers recently active people", () => {
    const viewer = man();
    const dormant = woman({ lastActiveAt: NOW - 30 * 86400000 });
    const active = woman({ lastActiveAt: NOW - 3600000 });
    const picks = rankPicks(
      viewer,
      [dormant, active].map((user) => ({ user, pendingInbound: 0 })),
      { count: 2, day: DAY, now: NOW },
    );
    expect(picks[0].uid).toBe(active.id);
  });
});
