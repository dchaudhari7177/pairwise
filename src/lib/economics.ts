// Unit economics: does a Pairwise city pay for itself, and how many cities
// does the company need before it stops costing eLitmus money?
//
// Pure functions, so the numbers quoted in the founder's notes and in the
// submission essays are computed by tested code rather than typed by hand.
// Every input is an assumption, labelled as one. They're illustrative pilot
// numbers, not forecasts.
//
// Two things the earlier back-of-envelope got wrong, and this fixes:
//   1. Consumer prices are GST-inclusive (that's what we show members), so
//      ₹299 is ₹253 of revenue, and the payment gateway takes ~2% of that.
//   2. Revenue without costs isn't ownership. A city has a lead, moderators,
//      infrastructure and local marketing; the company has a central team.

import { PRICES } from "./options";
import { VENUE_PRICING } from "./venues";

/** GST on online services. Consumer prices include it; B2B invoices add it on top. */
export const GST_RATE = 0.18;
/** Payment gateway fee on consumer payments (UPI AutoPay / cards via a gateway). */
export const GATEWAY_FEE = 0.02;

/** What we keep from a GST-inclusive consumer payment after GST and the gateway fee. */
export function netConsumer(grossInr: number): number {
  return (grossInr / (1 + GST_RATE)) * (1 - GATEWAY_FEE);
}

export type CityInputs = {
  /** Verified members in the city. */
  verified: number;
  /** Share of verified members active in a month. */
  activeShare: number;
  /** Share of monthly actives on Plus. */
  plusConversion: number;
  /** Share of Plus members on the monthly plan (the rest take the quarterly). */
  plusMonthlyMix: number;
  /** Partner venues paying a listing fee. */
  venues: number;
  /** Perk codes redeemed per month, per 1,000 monthly actives. */
  redemptionsPer1kActive: number;
  /** Ticketed Puzzle Nights per month. */
  eventsPerMonth: number;
  ticketsPerEvent: number;
  /** Sponsored Spark packs, ₹ per month (B2B, ex-GST). */
  sponsorInr: number;
};

export type CostInputs = {
  /** Cloud + hosting per monthly active (Firestore reads dominate: chat polls). */
  infraPerActiveInr: number;
  /** One trust & safety moderator per this many monthly actives. */
  activesPerModerator: number;
  moderatorInr: number;
  /** City lead: venue sales, events and community. */
  cityLeadInr: number;
  /** Local marketing: Puzzle Night promotion, campus and alumni meet-ups. */
  cityMarketingInr: number;
  /** Central team: founder/PM, 2 engineers, T&S lead, legal and accounting retainers. */
  centralInr: number;
};

export const TICKET_INR = 399;
/** Our share of ticket revenue after the venue's cut. */
export const EVENT_SHARE = 0.5;

export const BASE_COSTS: CostInputs = {
  infraPerActiveInr: 3,
  activesPerModerator: 10_000,
  moderatorInr: 35_000,
  cityLeadInr: 45_000,
  cityMarketingInr: 40_000,
  centralInr: 600_000,
};

/** One mature city, three ways. "Base" is the case the essays quote. */
export const SCENARIOS = {
  conservative: {
    label: "Conservative",
    city: { verified: 20_000, activeShare: 0.4, plusConversion: 0.025, plusMonthlyMix: 0.5, venues: 35, redemptionsPer1kActive: 80, eventsPerMonth: 4, ticketsPerEvent: 30, sponsorInr: 40_000 },
  },
  base: {
    label: "Base",
    city: { verified: 30_000, activeShare: 0.5, plusConversion: 0.04, plusMonthlyMix: 0.6, venues: 60, redemptionsPer1kActive: 133, eventsPerMonth: 8, ticketsPerEvent: 40, sponsorInr: 100_000 },
  },
  optimistic: {
    label: "Optimistic",
    city: { verified: 45_000, activeShare: 0.55, plusConversion: 0.06, plusMonthlyMix: 0.6, venues: 90, redemptionsPer1kActive: 160, eventsPerMonth: 12, ticketsPerEvent: 45, sponsorInr: 150_000 },
  },
} as const satisfies Record<string, { label: string; city: CityInputs }>;

export type ScenarioId = keyof typeof SCENARIOS;

export type CityPnl = {
  actives: number;
  plusMembers: number;
  revenue: { plus: number; venueListings: number; venueRedemptions: number; events: number; sponsored: number; total: number };
  costs: { infra: number; moderation: number; cityLead: number; marketing: number; total: number };
  contribution: number;
  /** Contribution as a share of revenue, 0–1. */
  margin: number;
  /** Share of revenue paid by businesses rather than members, 0–1. */
  businessShare: number;
  /** Net revenue per monthly active. */
  arpuInr: number;
};

/** Net Plus revenue per member per month, blending the monthly and quarterly plans. */
export function plusNetPerMember(monthlyMix: number): number {
  const monthly = netConsumer(PRICES.plus_monthly.inr);
  const quarterly = netConsumer(PRICES.plus_quarterly.inr) / PRICES.plus_quarterly.months;
  return monthlyMix * monthly + (1 - monthlyMix) * quarterly;
}

export function cityPnl(c: CityInputs, k: CostInputs = BASE_COSTS): CityPnl {
  const actives = Math.round(c.verified * c.activeShare);
  const plusMembers = Math.round(actives * c.plusConversion);
  const plus = plusMembers * plusNetPerMember(c.plusMonthlyMix);
  const venueListings = c.venues * VENUE_PRICING.listingInrPerMonth;
  const venueRedemptions = Math.round((actives / 1000) * c.redemptionsPer1kActive) * VENUE_PRICING.perRedemptionInr;
  const events = c.eventsPerMonth * c.ticketsPerEvent * netConsumer(TICKET_INR) * EVENT_SHARE;
  const sponsored = c.sponsorInr;
  const revenueTotal = plus + venueListings + venueRedemptions + events + sponsored;

  const infra = actives * k.infraPerActiveInr;
  // Always at least one moderator, even in a small city: safety isn't optional.
  const moderation = Math.max(1, Math.ceil(actives / k.activesPerModerator)) * k.moderatorInr;
  const costsTotal = infra + moderation + k.cityLeadInr + k.cityMarketingInr;

  const contribution = revenueTotal - costsTotal;
  return {
    actives,
    plusMembers,
    revenue: { plus, venueListings, venueRedemptions, events, sponsored, total: revenueTotal },
    costs: { infra, moderation, cityLead: k.cityLeadInr, marketing: k.cityMarketingInr, total: costsTotal },
    contribution,
    margin: revenueTotal > 0 ? contribution / revenueTotal : 0,
    businessShare: revenueTotal > 0 ? (venueListings + venueRedemptions + sponsored) / revenueTotal : 0,
    arpuInr: actives > 0 ? revenueTotal / actives : 0,
  };
}

/**
 * The smallest number of verified members at which a city covers its own
 * costs, holding every other ratio fixed (venues and sponsorship scale with
 * the city's size). Below this, a newly opened city is an investment.
 */
export function cityBreakEvenVerified(c: CityInputs, k: CostInputs = BASE_COSTS): number | null {
  const at = (verified: number) => {
    const scale = verified / c.verified;
    return cityPnl({ ...c, verified, venues: Math.round(c.venues * scale), sponsorInr: c.sponsorInr * scale }, k).contribution;
  };
  if (at(c.verified * 4) <= 0) return null;
  let lo = 0;
  let hi = c.verified * 4;
  while (hi - lo > 50) {
    const mid = (lo + hi) / 2;
    if (at(mid) >= 0) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi / 100) * 100;
}

export type CompanyPnl = {
  cities: number;
  revenue: number;
  contribution: number;
  operatingProfit: number;
  /** Mature cities needed to cover the central team, or null if a city never contributes. */
  breakEvenCities: number | null;
};

export function companyPnl(c: CityInputs, cities: number, k: CostInputs = BASE_COSTS): CompanyPnl {
  const city = cityPnl(c, k);
  return {
    cities,
    revenue: city.revenue.total * cities,
    contribution: city.contribution * cities,
    operatingProfit: city.contribution * cities - k.centralInr,
    breakEvenCities: city.contribution > 0 ? Math.ceil(k.centralInr / city.contribution) : null,
  };
}

/** ₹ in Indian notation: ₹5.7L, ₹1.4Cr, ₹45,000. */
export function inr(n: number): string {
  const sign = n < 0 ? "−" : "";
  const a = Math.abs(n);
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toFixed(a >= 1e8 ? 0 : 1)}Cr`;
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(1)}L`;
  return `${sign}₹${Math.round(a).toLocaleString("en-IN")}`;
}
