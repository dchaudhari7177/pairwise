"use client";

import { useMemo, useState } from "react";
import {
  BASE_COSTS,
  cityBreakEvenVerified,
  cityPnl,
  companyPnl,
  EVENT_SHARE,
  GATEWAY_FEE,
  GST_RATE,
  inr,
  SCENARIOS,
  TICKET_INR,
  type CityInputs,
  type ScenarioId,
} from "@/lib/economics";
import { PRICES } from "@/lib/options";
import { VENUE_PRICING } from "@/lib/venues";

type Knob = {
  key: keyof CityInputs;
  label: string;
  min: number;
  max: number;
  step: number;
  show: (v: number) => string;
  hint: string;
};

const KNOBS: Knob[] = [
  { key: "verified", label: "Verified members in the city", min: 1_500, max: 60_000, step: 500, show: (v) => v.toLocaleString("en-IN"), hint: "A city opens at 1,500." },
  { key: "activeShare", label: "Active each month", min: 0.2, max: 0.7, step: 0.05, show: (v) => `${Math.round(v * 100)}%`, hint: "Slow dating: a weekly habit, not a daily one." },
  { key: "plusConversion", label: "Actives on Plus", min: 0, max: 0.1, step: 0.005, show: (v) => `${(v * 100).toFixed(1)}%`, hint: "Dating apps convert 3–8%; we keep the best levers free." },
  { key: "venues", label: "Partner venues", min: 0, max: 150, step: 5, show: (v) => String(v), hint: `₹${VENUE_PRICING.listingInrPerMonth.toLocaleString("en-IN")} a month each.` },
  { key: "redemptionsPer1kActive", label: "Perk dates per 1,000 actives a month", min: 0, max: 250, step: 5, show: (v) => String(v), hint: `₹${VENUE_PRICING.perRedemptionInr} each, billed to the venue.` },
];

const COLORS = {
  plus: "bg-plum",
  venueListings: "bg-rose",
  venueRedemptions: "bg-rose/60",
  events: "bg-amber",
  sponsored: "bg-sage",
} as const;

const LINE_LABELS: Record<keyof typeof COLORS, string> = {
  plus: "Pairwise Plus (net of GST & fees)",
  venueListings: "Venue listings",
  venueRedemptions: "Redeemed perk dates",
  events: "Puzzle Night tickets (our share)",
  sponsored: "Sponsored Sparks",
};

/**
 * Interactive city P&L. Pick a scenario or drag the assumptions, and see
 * whether a city pays for itself and how many the company needs. Everything
 * is computed by src/lib/economics.ts, which the test suite pins to the
 * figures quoted in the essays.
 */
export function EconomicsModel({ compact = false }: { compact?: boolean }) {
  const [scenario, setScenario] = useState<ScenarioId | "custom">("base");
  const [city, setCity] = useState<CityInputs>({ ...SCENARIOS.base.city });
  const [cities, setCities] = useState(5);

  const p = useMemo(() => cityPnl(city), [city]);
  const be = useMemo(() => cityBreakEvenVerified(city), [city]);
  const co = useMemo(() => companyPnl(city, cities), [city, cities]);

  function pick(id: ScenarioId) {
    setScenario(id);
    setCity({ ...SCENARIOS[id].city });
  }
  function set(key: keyof CityInputs, v: number) {
    setScenario("custom");
    setCity((c) => ({ ...c, [key]: v }));
  }

  const lines = (Object.keys(COLORS) as (keyof typeof COLORS)[]).map((k) => ({ k, v: p.revenue[k] }));
  const total = Math.max(1, p.revenue.total);
  const profitable = p.contribution >= 0;

  return (
    <div className="card overflow-hidden text-ink">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line p-5">
        <div>
          <div className="eyebrow">Interactive model</div>
          <div className="mt-1 text-lg font-semibold">Does a city pay for itself?</div>
          <div className="mt-0.5 text-sm text-ink-2">One mature city, per month. Drag the assumptions or pick a case.</div>
        </div>
        <div className="flex rounded-full bg-paper-2 p-1 text-sm" role="group" aria-label="Scenario">
          {(Object.keys(SCENARIOS) as ScenarioId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => pick(id)}
              aria-pressed={scenario === id}
              className={`rounded-full px-3 py-1.5 font-medium transition ${scenario === id ? "bg-card text-ink shadow-sm" : "text-ink-2 hover:text-ink"}`}
            >
              {SCENARIOS[id].label}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-0 ${compact ? "lg:grid-cols-[1fr_1.2fr]" : "md:grid-cols-[1fr_1.2fr]"}`}>
        {/* Assumptions */}
        <div className="space-y-4 border-line p-5 md:border-r">
          {KNOBS.map((k) => (
            <label key={k.key} className="block">
              <span className="flex items-baseline justify-between gap-2 text-sm">
                <span className="text-ink-2">{k.label}</span>
                <span className="font-semibold tabular-nums">{k.show(city[k.key])}</span>
              </span>
              <input
                type="range"
                min={k.min}
                max={k.max}
                step={k.step}
                value={city[k.key]}
                onChange={(e) => set(k.key, Number(e.target.value))}
                className="mt-1.5 w-full accent-[var(--rose)]"
              />
              <span className="block text-xs text-muted">{k.hint}</span>
            </label>
          ))}
          <div className="rounded-2xl bg-paper-2/70 p-3 text-xs leading-relaxed text-muted">
            Fixed in this model: Plus at ₹{PRICES.plus_monthly.inr}/month or ₹{PRICES.plus_quarterly.inr}/quarter ({Math.round(city.plusMonthlyMix * 100)}% monthly), prices shown
            to members include {GST_RATE * 100}% GST, gateway {GATEWAY_FEE * 100}%; {city.eventsPerMonth} Puzzle Nights × {city.ticketsPerEvent} tickets at ₹{TICKET_INR}, {EVENT_SHARE * 100}% to the
            venue; sponsorship {inr(city.sponsorInr)}. Costs: infra ₹{BASE_COSTS.infraPerActiveInr}/active, one moderator per{" "}
            {BASE_COSTS.activesPerModerator.toLocaleString("en-IN")} actives at {inr(BASE_COSTS.moderatorInr)}, a city lead at {inr(BASE_COSTS.cityLeadInr)}, local marketing{" "}
            {inr(BASE_COSTS.cityMarketingInr)}.
          </div>
        </div>

        {/* Results */}
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-2xl p-4 ${profitable ? "bg-sage-soft" : "bg-rose-soft"}`}>
              <div className="text-xs text-ink-2">Contribution per city</div>
              <div className={`mt-1 font-display text-3xl font-semibold ${profitable ? "text-sage" : "text-rose-2"}`}>{inr(p.contribution)}</div>
              <div className="text-xs text-ink-2">{Math.round(p.margin * 100)}% of {inr(p.revenue.total)} revenue</div>
            </div>
            <div className="rounded-2xl bg-paper-2 p-4">
              <div className="text-xs text-ink-2">Paid by businesses</div>
              <div className="mt-1 font-display text-3xl font-semibold">{Math.round(p.businessShare * 100)}%</div>
              <div className="text-xs text-ink-2">{p.businessShare >= 0.5 ? "Members aren't the ones squeezed" : "Drifting toward squeezing members"}</div>
            </div>
          </div>

          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-paper-2" role="img" aria-label="Revenue by source">
            {lines.map(({ k, v }) => (
              <div key={k} className={COLORS[k]} style={{ width: `${(v / total) * 100}%` }} />
            ))}
          </div>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {lines.map(({ k, v }) => (
                <tr key={k}>
                  <td className="py-1 pr-2">
                    <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${COLORS[k]}`} />
                    <span className="text-ink-2">{LINE_LABELS[k]}</span>
                  </td>
                  <td className="py-1 text-right font-semibold tabular-nums">{inr(v)}</td>
                </tr>
              ))}
              <tr className="border-t border-line">
                <td className="pt-2 pr-2 text-ink-2">
                  Costs: {Math.max(1, Math.ceil(p.actives / BASE_COSTS.activesPerModerator))} moderator{p.costs.moderation > BASE_COSTS.moderatorInr ? "s" : ""}, city lead, infra, marketing
                </td>
                <td className="pt-2 text-right font-semibold tabular-nums text-rose-2">−{inr(p.costs.total)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-5 space-y-2 rounded-2xl border border-line p-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-ink-2">A city pays for itself from</span>
              <span className="font-semibold">{be ? `${be.toLocaleString("en-IN")} verified` : "never, at these rates"}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-ink-2">
                Company breaks even at
                <span className="block text-xs text-muted">central team {inr(BASE_COSTS.centralInr)} a month</span>
              </span>
              <span className="font-semibold">{co.breakEvenCities ? `${co.breakEvenCities} ${co.breakEvenCities === 1 ? "city" : "cities"}` : "never"}</span>
            </div>
            <div className="border-t border-line pt-2">
              <label className="flex items-center gap-2 text-ink-2">
                A year with
                <select value={cities} onChange={(e) => setCities(Number(e.target.value))} className="rounded-lg border border-line bg-card px-1.5 py-0.5 text-ink">
                  {[1, 2, 3, 5, 8, 10].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                mature {cities === 1 ? "city" : "cities"}
              </label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-paper-2 px-3 py-2">
                  <div className="text-xs text-muted">Revenue</div>
                  <div className="font-semibold tabular-nums">{inr(co.revenue * 12)}</div>
                </div>
                <div className={`rounded-xl px-3 py-2 ${co.operatingProfit >= 0 ? "bg-sage-soft" : "bg-rose-soft"}`}>
                  <div className="text-xs text-muted">Operating {co.operatingProfit >= 0 ? "profit" : "loss"}</div>
                  <div className={`font-semibold tabular-nums ${co.operatingProfit >= 0 ? "text-sage" : "text-rose-2"}`}>{inr(co.operatingProfit * 12)}</div>
                </div>
              </div>
            </div>
          </div>
          {be && (
            <div className="mt-3 text-xs leading-relaxed text-muted">
              So a city opened at the 1,500-member launch line is an investment until it reaches about {be.toLocaleString("en-IN")} verified members. That&apos;s why
              cities open one at a time and only from a full waitlist.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
