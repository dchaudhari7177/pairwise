import { describe, expect, it } from "vitest";
import { GATE, nextCityGate, weekRetention, type GateInput } from "@/lib/gates";

const healthy: GateInput = {
  largestCityActive: 2_000,
  womenShare: 44,
  pickDecisionRate: 52,
  ghostRate: 18,
  dateRate: 21,
  week4Retention: 33,
  payingVenues: 14,
};

describe("nextCityGate", () => {
  it("says go only when every criterion holds at a real sample size", () => {
    const g = nextCityGate(healthy);
    expect(g.verdict).toBe("go");
    expect(g.checks.every((c) => c.status === "pass")).toBe(true);
  });

  it("refuses to decide on a small sample, however good the numbers look", () => {
    const g = nextCityGate({ ...healthy, largestCityActive: 40 });
    expect(g.verdict).toBe("too_early");
    expect(g.checks.find((c) => c.id === "liquidity")!.status).toBe("pending");
    // The other readings are still shown, as directional.
    expect(g.checks.find((c) => c.id === "H2")!.status).toBe("pass");
  });

  it("says iterate when a target is missed but no kill line is crossed", () => {
    const g = nextCityGate({ ...healthy, dateRate: 9 });
    expect(g.verdict).toBe("iterate");
    expect(g.checks.find((c) => c.id === "H6")!.status).toBe("fail");
    expect(g.kills).toEqual([]);
  });

  it("treats missing data as not yet holding", () => {
    expect(nextCityGate({ ...healthy, week4Retention: null }).verdict).toBe("iterate");
  });

  it("says stop when a kill line is crossed", () => {
    for (const bad of [{ womenShare: 25 }, { dateRate: 3 }, { week4Retention: 6 }, { ghostRate: 60 }]) {
      const g = nextCityGate({ ...healthy, ...bad });
      expect(g.verdict).toBe("stop");
      expect(g.kills).toHaveLength(1);
    }
  });

  it("puts every kill line well below its target", () => {
    expect(GATE.womenShare.kill).toBeLessThan(GATE.womenShare.target);
    expect(GATE.dateRate.kill).toBeLessThan(GATE.dateRate.target);
    expect(GATE.week4Retention.kill).toBeLessThan(GATE.week4Retention.target);
    expect(GATE.ghostRate.kill).toBeGreaterThan(GATE.ghostRate.target);
  });
});

describe("weekRetention", () => {
  it("weights cohorts by size and skips weeks not reached", () => {
    const cohorts = [
      { weeks: [null, null, null, null, { active: 3, eligible: 10 }] },
      { weeks: [null, null, null, null, { active: 7, eligible: 10 }] },
      { weeks: [null, null, null, null, null] },
    ];
    expect(weekRetention(cohorts, 4)).toBe(50);
    expect(weekRetention([{ weeks: [null] }], 4)).toBeNull();
  });
});
