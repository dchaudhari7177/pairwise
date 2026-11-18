import { randomBytes } from "node:crypto";
import { badRequest, forbidden, notFound } from "../errors";
import type { DocStore } from "../store/types";
import { DAY, istDay } from "../time";
import type { Match, Redemption } from "../types";
import { getVenue, VENUE_PRICING } from "../venues";

// Partner-venue perks: the revenue line that lets members use Pairwise free.
//
// When two people agree to a date at a partner venue, they get one perk code.
// The venue enters it on the day (the partner redeem page), the couple gets the
// perk, and the venue is billed a small fee per redeemed date on top of its
// monthly listing. Couples are footfall venues want; we earn at the exact step
// where members most need help, getting from chat to a safe first date.

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newPerkCode(bytes: Buffer = randomBytes(6)): string {
  let s = "";
  for (const b of bytes) s += ALPHABET[b % ALPHABET.length];
  return `PW-${s}`;
}

/** Write ops that issue a perk code for an accepted date, if the venue is a partner. */
export function issuePerk(m: Match, venueId: string, at: number, now: number, code = newPerkCode()) {
  const venue = getVenue(venueId);
  if (!venue?.partner) return { code: undefined, ops: [] };
  const r: Redemption = { id: code, matchId: m.id, venueId, at, createdAt: now };
  return { code, ops: [{ type: "set" as const, col: "redemptions", id: code, data: r }] };
}

/** A code can be redeemed on the day of the date (IST), or up to 24 hours after it. */
export function inWindow(at: number, now: number) {
  return istDay(now) === istDay(at) || (now > at && now - at < DAY);
}

export async function redeemPerk(store: DocStore, venueId: string, raw: string, now = Date.now()) {
  const code = raw.trim().toUpperCase().replace(/^PW(?!-)/, "PW-");
  if (!/^PW-[A-Z0-9]{6}$/.test(code)) throw badRequest("Perk codes look like PW-7Q4M2K.");
  const venue = getVenue(venueId);
  if (!venue?.partner) throw notFound("That venue isn't a Pairwise partner.");
  const r = await store.get<Redemption>("redemptions", code);
  if (!r) throw notFound("We couldn't find that code.");
  if (r.venueId !== venueId) throw forbidden(`That code is for ${getVenue(r.venueId)?.name ?? "another venue"}, not ${venue.name}.`);
  if (r.redeemedAt) throw badRequest("That code has already been used.");
  const m = await store.get<Match>("matches", r.matchId);
  if (!m || m.status !== "active" || m.datePlan?.status !== "accepted" || m.datePlan.perkCode !== code) {
    throw badRequest("This date was changed or cancelled, so the code no longer works.");
  }
  if (!inWindow(m.datePlan.at, now)) {
    throw badRequest(now < m.datePlan.at ? "This code works on the day of the date." : "This code has expired.");
  }
  await store.update("redemptions", code, { redeemedAt: now });
  return { ok: true, venue: venue.name, perk: venue.perk, feeInr: VENUE_PRICING.perRedemptionInr };
}
