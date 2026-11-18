// City launch control: the go-to-market plan, enforced in code.
//
// Two-sided markets die from imbalance, not from being small. So:
//  1. A city opens only once it can give every member a real pool to meet.
//     Until then, sign-ups there wait (and see how close their city is).
//  2. In an open city, women and anyone not seeking women are admitted at
//     once. Men seeking women are admitted only while women stay at 40% or
//     more of that market, first come first served, so nobody jumps the line.
//  3. A verified member can vouch for up to three people. A vouch skips the
//     balance queue (trust is the scarce thing here, not men), but it can't
//     open a closed city; it only puts you first in line when it opens.

import { badRequest, forbidden, notFound } from "../errors";
import { CITIES } from "../options";
import type { DocStore } from "../store/types";
import { del } from "../store/types";
import type { CityId, Profile, User, Vouch, WaitlistReason } from "../types";

export const LAUNCH = {
  /** Verified members a city needs before it opens. */
  minVerified: 1500,
  /** Share of women (among women + men seeking women) we keep at or above. */
  minWomenShare: 0.4,
  /**
   * The share of a city one typical member is compatible with: orientation
   * (~1/2) × age range (~40%) × intent (~80%). See docs/GTM.md.
   */
  compatibleFraction: 0.5 * 0.4 * 0.8,
  picksPerDay: 5,
  vouchesPerMember: 3,
} as const;

/** Men seeking women are the side of the market that outnumbers the other. */
export function isBalanceGated(p: Pick<Profile, "gender" | "interestedIn">): boolean {
  return p.gender === "man" && p.interestedIn.includes("woman");
}

export interface Admission {
  status: "active" | "waitlisted";
  reason?: WaitlistReason;
}

interface Market {
  women: number;
  gatedMen: number;
}

const share = (m: Market) => (m.women + m.gatedMen === 0 ? 1 : m.women / (m.women + m.gatedMen));

function marketOf(users: User[]): Market {
  let women = 0;
  let gatedMen = 0;
  for (const u of users) {
    if (!u.profile) continue;
    if (u.profile.gender === "woman") women++;
    else if (isBalanceGated(u.profile)) gatedMen++;
  }
  return { women, gatedMen };
}

/** Queue order: vouched people first, then first come first served. */
export function queueOrder(a: User, b: User) {
  const va = a.vouchedBy ? 0 : 1;
  const vb = b.vouchedBy ? 0 : 1;
  return va - vb || (a.waitlist?.joinedAt ?? 0) - (b.waitlist?.joinedAt ?? 0);
}

async function cityUsers(store: DocStore, city: CityId) {
  const users = await store.query<User>("users", [["profile.city", "==", city]]);
  const members = users.filter((u) => u.role === "member" && u.onboarded && u.profile);
  return {
    active: members.filter((u) => u.status === "active" || u.status === "paused"),
    waiting: members.filter((u) => u.status === "waitlisted").sort(queueOrder),
  };
}

/** Pure admission rule, so it can be unit-tested without a store. */
export function decide(p: Pick<Profile, "gender" | "interestedIn" | "city">, market: Market, gatedQueue: number): Admission {
  if (!CITIES[p.city]?.open) return { status: "waitlisted", reason: "city_closed" };
  if (!isBalanceGated(p)) return { status: "active" };
  // Someone is already waiting: join the back of the line.
  if (gatedQueue > 0) return { status: "waitlisted", reason: "balance" };
  const after = share({ women: market.women, gatedMen: market.gatedMen + 1 });
  return after >= LAUNCH.minWomenShare ? { status: "active" } : { status: "waitlisted", reason: "balance" };
}

export async function decideAdmission(store: DocStore, user: User, profile: Profile): Promise<Admission> {
  const { active, waiting } = await cityUsers(store, profile.city);
  const gatedQueue = waiting.filter((u) => u.id !== user.id && isBalanceGated(u.profile!)).length;
  return decide(profile, marketOf(active.filter((u) => u.id !== user.id)), gatedQueue);
}

/** The patch that puts a member on the waitlist or lets them in. */
export function admissionPatch(user: User, a: Admission, city: CityId, now: number) {
  if (a.status === "active") {
    return user.status === "waitlisted" ? { status: "active", admittedAt: now, waitlist: del() } : {};
  }
  const sameQueue = user.waitlist?.city === city && user.waitlist.reason === a.reason;
  return { status: "waitlisted", waitlist: { city, reason: a.reason!, joinedAt: sameQueue ? user.waitlist!.joinedAt : now } };
}

// ---------------------------------------------------------------------------
// Liquidity: what the founder console and the waitlist screen show.

export interface CityLaunch {
  city: CityId;
  label: string;
  open: boolean;
  active: number;
  women: number;
  gatedMen: number;
  /** Share of women in the market this city serves (rounded %). */
  womenShare: number;
  waitlist: { total: number; women: number; men: number; vouched: number };
  /** Verified members so far (active + waiting) toward the opening threshold. */
  verified: number;
  progress: number;
  /** Profiles one typical member is compatible with, and how many days of picks that is. */
  pool: number;
  daysOfPicks: number;
  ready: boolean;
}

export function launchStats(city: CityId, active: User[], waiting: User[]): CityLaunch {
  const market = marketOf(CITIES[city].open ? active : [...active, ...waiting]);
  const verified = active.length + waiting.length;
  const base = CITIES[city].open ? active.length : verified;
  const pool = Math.round(base * LAUNCH.compatibleFraction);
  const womenShare = Math.round(share(market) * 100);
  return {
    city,
    label: CITIES[city].label,
    open: CITIES[city].open,
    active: active.length,
    women: market.women,
    gatedMen: market.gatedMen,
    womenShare,
    waitlist: {
      total: waiting.length,
      women: waiting.filter((u) => u.profile!.gender === "woman").length,
      men: waiting.filter((u) => u.profile!.gender === "man").length,
      vouched: waiting.filter((u) => u.vouchedBy).length,
    },
    verified,
    progress: Math.min(100, Math.round((verified / LAUNCH.minVerified) * 100)),
    pool,
    daysOfPicks: Math.floor(pool / LAUNCH.picksPerDay),
    ready: verified >= LAUNCH.minVerified && womenShare >= LAUNCH.minWomenShare * 100,
  };
}

export async function cityLaunch(store: DocStore, city: CityId): Promise<CityLaunch> {
  const { active, waiting } = await cityUsers(store, city);
  return launchStats(city, active, waiting);
}

export async function launchBoard(store: DocStore): Promise<CityLaunch[]> {
  return Promise.all((Object.keys(CITIES) as CityId[]).map((c) => cityLaunch(store, c)));
}

export interface WaitlistView {
  reason: WaitlistReason;
  position: number;
  ahead: number;
  vouchedBy?: string;
  city: CityLaunch;
}

export async function waitlistView(store: DocStore, user: User): Promise<WaitlistView | null> {
  if (user.status !== "waitlisted" || !user.waitlist || !user.profile) return null;
  const { active, waiting } = await cityUsers(store, user.waitlist.city);
  const queue = user.waitlist.reason === "balance" ? waiting.filter((u) => isBalanceGated(u.profile!)) : waiting;
  const idx = queue.findIndex((u) => u.id === user.id);
  const position = idx === -1 ? queue.length + 1 : idx + 1;
  let vouchedBy: string | undefined;
  if (user.vouchedBy) vouchedBy = (await store.get<User>("users", user.vouchedBy))?.profile?.firstName;
  return { reason: user.waitlist.reason, position, ahead: position - 1, vouchedBy, city: launchStats(user.waitlist.city, active, waiting) };
}

/**
 * Admit as many people from a city's waitlist as the balance rule allows, in
 * queue order. Women and people not seeking women always get in; each man
 * seeking women gets in only if women stay at 40% or more afterwards.
 */
export async function admitNextBatch(store: DocStore, city: CityId, now = Date.now()) {
  if (!CITIES[city]?.open) throw forbidden(`${CITIES[city]?.label ?? city} isn't open yet. It opens at ${LAUNCH.minVerified.toLocaleString("en-IN")} verified members.`);
  const { active, waiting } = await cityUsers(store, city);
  const market = marketOf(active);
  // Women first: admitting them makes room for men in the same batch.
  const ordered = [...waiting.filter((u) => !isBalanceGated(u.profile!)), ...waiting.filter((u) => isBalanceGated(u.profile!))];
  const admitted: string[] = [];
  for (const u of ordered) {
    if (isBalanceGated(u.profile!)) {
      if (share({ women: market.women, gatedMen: market.gatedMen + 1 }) < LAUNCH.minWomenShare) break;
      market.gatedMen++;
    } else if (u.profile!.gender === "woman") market.women++;
    admitted.push(u.id);
  }
  if (admitted.length) {
    await store.batch(admitted.map((id) => ({ type: "update" as const, col: "users", id, patch: { status: "active", admittedAt: now, waitlist: del() } })));
  }
  const stillWaiting = waiting.length - admitted.length;
  return { admitted: admitted.length, stillWaiting };
}

// ---------------------------------------------------------------------------
// Vouches

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function code(name: string, rand: () => number = Math.random) {
  const prefix = name.normalize("NFD").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 6) || "PAIR";
  let s = "";
  for (let i = 0; i < 4; i++) s += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  return `${prefix}-${s}`;
}

export function canVouch(user: User) {
  return user.role === "member" && user.status === "active" && user.verification.identity && !!user.profile;
}

/** A member's vouch codes, created the first time they're needed. */
export async function myVouches(store: DocStore, user: User, now = Date.now()) {
  if (!canVouch(user)) return [];
  const existing = await store.query<Vouch>("vouches", [["by", "==", user.id]]);
  if (existing.length >= LAUNCH.vouchesPerMember) return existing.sort((a, b) => a.createdAt - b.createdAt);
  const fresh: Vouch[] = [];
  for (let i = existing.length; i < LAUNCH.vouchesPerMember; i++) {
    let c = code(user.profile!.firstName);
    while (await store.get("vouches", c)) c = code(user.profile!.firstName);
    fresh.push({ id: c, by: user.id, createdAt: now + i });
  }
  await store.batch(fresh.map((v) => ({ type: "set" as const, col: "vouches", id: v.id, data: v })));
  return [...existing, ...fresh].sort((a, b) => a.createdAt - b.createdAt);
}

export async function vouchUsers(store: DocStore, vouches: Vouch[]) {
  const ids = vouches.map((v) => v.usedBy).filter((x): x is string => !!x);
  const users = await store.getMany<User>("users", ids);
  return new Map(users.filter((u): u is User => !!u).map((u) => [u.id, u.profile?.firstName ?? "Someone"]));
}

export async function redeemVouch(store: DocStore, user: User, raw: string, now = Date.now()) {
  const id = raw.trim().toUpperCase();
  if (!/^[A-Z]{1,6}-[A-Z0-9]{4}$/.test(id)) throw badRequest("That doesn't look like a vouch code. It's a name and four characters, like ASHA-7K2P.");
  if (user.status !== "waitlisted" || !user.waitlist) throw badRequest("You're already in. Vouches are for people on the waitlist.");
  if (user.vouchedBy) throw badRequest("Someone has already vouched for you.");
  const v = await store.get<Vouch>("vouches", id);
  if (!v) throw notFound("We couldn't find that code. Check it with the friend who sent it.");
  if (v.usedBy) throw badRequest("That code has already been used. Each code works once.");
  if (v.by === user.id) throw badRequest("You can't vouch for yourself.");
  const voucher = await store.get<User>("users", v.by);
  if (!voucher || !canVouch(voucher)) throw forbidden("That member can't vouch right now.");

  const opensNow = user.waitlist.reason === "balance";
  await store.batch([
    { type: "update", col: "vouches", id, patch: { usedBy: user.id, usedAt: now } },
    {
      type: "update",
      col: "users",
      id: user.id,
      patch: opensNow ? { vouchedBy: voucher.id, status: "active", admittedAt: now, waitlist: del() } : { vouchedBy: voucher.id },
    },
  ]);
  return { admitted: opensNow, voucher: voucher.profile!.firstName };
}

/** Exposed for tests: a deterministic code generator. */
export const _code = code;
