import { describe, expect, it } from "vitest";
import {
  BASE_COSTS,
  cityBreakEvenVerified,
  cityPnl,
  companyPnl,
  inr,
  netConsumer,
  plusNetPerMember,
  SCENARIOS,
} from "@/lib/economics";

const base = SCENARIOS.base.city;

describe("netConsumer", () => {
  it("strips GST from an inclusive price, then the gateway fee", () => {
    // ₹299 incl. 18% GST is ₹253.39 of revenue; 2% gateway leaves ₹248.32.
    expect(netConsumer(299)).toBeCloseTo(248.32, 1);
    expect(netConsumer(118)).toBeCloseTo(98, 5);
  });

  it("blends the monthly and quarterly plans", () => {
    expect(plusNetPerMember(1)).toBeCloseTo(netConsumer(299), 5);
    expect(plusNetPerMember(0)).toBeCloseTo(netConsumer(699) / 3, 5);
    expect(plusNetPerMember(0.6)).toBeGreaterThan(plusNetPerMember(0));
  });
});

describe("cityPnl", () => {
  const p = cityPnl(base);

  it("sums revenue lines and cost lines", () => {
    const r = p.revenue;
    expect(r.total).toBeCloseTo(r.plus + r.venueListings + r.venueRedemptions + r.events + r.sponsored, 5);
    const c = p.costs;
    expect(c.total).toBeCloseTo(c.infra + c.moderation + c.cityLead + c.marketing, 5);
    expect(p.contribution).toBeCloseTo(r.total - c.total, 5);
  });

  // These are the figures the monetisation essay quotes. If an assumption
  // changes, this test fails and the essay has to change with it.
  it("matches the base case quoted in the essays", () => {
    expect(p.actives).toBe(15_000);
    expect(p.plusMembers).toBe(600);
    expect(inr(p.revenue.total)).toBe("₹5.7L");
    expect(inr(p.costs.total)).toBe("₹2.0L");
    expect(inr(p.contribution)).toBe("₹3.7L");
    expect(Math.round(p.businessShare * 100)).toBe(67);
    expect(cityBreakEvenVerified(base)).toBe(4300);
    expect(companyPnl(base, 5).breakEvenCities).toBe(2);
  });

  it("keeps businesses paying most of the bill in every scenario", () => {
    for (const s of Object.values(SCENARIOS)) expect(cityPnl(s.city).businessShare).toBeGreaterThan(0.5);
  });

  it("always staffs at least one moderator", () => {
    const tiny = cityPnl({ ...base, verified: 200 });
    expect(tiny.costs.moderation).toBe(BASE_COSTS.moderatorInr);
  });

  it("gets better per member as a city grows (fixed costs spread)", () => {
    expect(cityPnl(SCENARIOS.optimistic.city).margin).toBeGreaterThan(cityPnl(SCENARIOS.conservative.city).margin);
  });
});

describe("break-even", () => {
  it("finds the size at which a city covers its costs", () => {
    const be = cityBreakEvenVerified(base)!;
    const scaled = (v: number) => ({ ...base, verified: v, venues: Math.round(base.venues * (v / base.verified)), sponsorInr: base.sponsorInr * (v / base.verified) });
    expect(cityPnl(scaled(be)).contribution).toBeGreaterThanOrEqual(0);
    expect(cityPnl(scaled(be - 500)).contribution).toBeLessThan(0);
  });

  it("says so honestly when a city never pays for itself", () => {
    expect(cityBreakEvenVerified({ ...base, plusConversion: 0, venues: 0, redemptionsPer1kActive: 0, eventsPerMonth: 0, sponsorInr: 0 })).toBeNull();
    expect(companyPnl({ ...base, plusConversion: 0, venues: 0, redemptionsPer1kActive: 0, eventsPerMonth: 0, sponsorInr: 0 }, 5).breakEvenCities).toBeNull();
  });

  it("needs more cities in the conservative case, and shows the loss", () => {
    const c = companyPnl(SCENARIOS.conservative.city, 5);
    expect(c.breakEvenCities).toBeGreaterThan(5);
    expect(c.operatingProfit).toBeLessThan(0);
  });
});

describe("inr", () => {
  it("formats in Indian notation", () => {
    expect(inr(45_000)).toBe("₹45,000");
    expect(inr(570_000)).toBe("₹5.7L");
    expect(inr(34_000_000)).toBe("₹3.4Cr");
    expect(inr(-1_380_000)).toBe("−₹13.8L");
  });
});
