import { INTENTS } from "../options";
import { ageFrom } from "../time";
import type { Intent, LifePlan, User } from "../types";

/**
 * Compatibility in two stages:
 *
 *  1. Hard filters (`blockers`): the things that make a match pointless or
 *     unsafe: orientation, age ranges, city, incompatible intent or kids,
 *     blocks, and privacy walls (same company / same college).
 *  2. A 0–100 score built only from things people *chose to tell us* about
 *     how they want to live. Looks, popularity and income play no part.
 *
 * Every point of the score maps to a human-readable reason, so the app can
 * tell you *why* someone is in your picks.
 */

export type Blocker =
  | "not_active"
  | "not_verified"
  | "orientation"
  | "age"
  | "city"
  | "intent"
  | "kids"
  | "same_company"
  | "same_college"
  | "blocked";

export interface Assessment {
  blockers: Blocker[];
  score: number;
  breakdown: Record<"values" | "interests" | "lifePlan" | "intent" | "languages" | "habits", number>;
  reasons: string[];
}

export interface AssessContext {
  now?: number;
  /** uids blocked in either direction. */
  blocked?: Set<string>;
}

/** The city a member is currently browsing (Plus travel mode overrides home). */
export function browsingCity(u: User) {
  return u.plan === "plus" && u.travelCity ? u.travelCity : u.profile!.city;
}

function intentFit(a: Intent, b: Intent): number | null {
  if (a === b) return 10;
  const pair = [a, b].sort().join("+");
  if (pair === "long_term+marriage") return 7;
  if (pair === "figuring_out+long_term") return 4;
  return null; // figuring_out + marriage: different enough to be a dealbreaker
}

function overlap(a: string[], b: string[]): string[] {
  const set = new Set(b);
  return a.filter((x) => set.has(x));
}

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function lifePlanScore(a: LifePlan, b: LifePlan, reasons: string[]): number {
  let s = 0;
  // Timeline (8): the strongest predictor of "are we even on the same page?"
  if (a.timeline === b.timeline) {
    s += 8;
    if (a.timeline === "within_2y") reasons.push("You both see yourselves settling down within ~2 years");
    if (a.timeline === "2_4y") reasons.push("Same pace: both thinking 2–4 years out");
  } else if (a.timeline === "not_sure" || b.timeline === "not_sure") s += 4;
  else s += 2;
  // Kids (6). want/dont_want never reaches here (it is a blocker).
  if (a.kids === b.kids && a.kids !== "not_sure") s += 6;
  else if (a.kids === "open" || b.kids === "open" || a.kids === "not_sure" || b.kids === "not_sure") s += 3;
  // Family setup (6)
  if (a.family === b.family && a.family !== "open") {
    s += 6;
    reasons.push(a.family === "joint" ? "You'd both like to live with family" : "You'd both like your own place");
  } else if (a.family === "open" || b.family === "open") s += 4;
  // Relocation (5)
  if (a.relocate !== "no" && b.relocate !== "no") {
    s += 5;
    if (a.relocate === "yes" && b.relocate === "yes") reasons.push("You're both open to moving cities for the right person");
  } else if (a.relocate === b.relocate) s += 5;
  else s += 2;
  return s;
}

export function assess(viewer: User, candidate: User, ctx: AssessContext = {}): Assessment {
  const now = ctx.now ?? Date.now();
  const v = viewer.profile!;
  const c = candidate.profile!;
  const blockers: Blocker[] = [];

  if (candidate.status !== "active" || !candidate.onboarded) blockers.push("not_active");
  if (!candidate.verification.identity) blockers.push("not_verified");
  if (!v.interestedIn.includes(c.gender) || !c.interestedIn.includes(v.gender)) blockers.push("orientation");

  const vAge = ageFrom(v.birthDate, now);
  const cAge = ageFrom(c.birthDate, now);
  if (cAge < v.ageRange[0] || cAge > v.ageRange[1] || vAge < c.ageRange[0] || vAge > c.ageRange[1]) {
    blockers.push("age");
  }

  if (browsingCity(viewer) !== c.city) blockers.push("city");

  const intent = intentFit(v.intent, c.intent);
  if (intent === null) blockers.push("intent");

  const kidsPair = [v.lifePlan.kids, c.lifePlan.kids].sort().join("+");
  if (kidsPair === "dont_want+want") blockers.push("kids");

  // Privacy walls are symmetric: if either person opts in, neither sees the other.
  const vWork = viewer.verification.work?.domain;
  const cWork = candidate.verification.work?.domain;
  if (vWork && vWork === cWork && (viewer.privacy.hideFromCompany || candidate.privacy.hideFromCompany)) {
    blockers.push("same_company");
  }
  const vCollege = viewer.verification.education?.college;
  const cCollege = candidate.verification.education?.college;
  if (vCollege && vCollege === cCollege && (viewer.privacy.hideFromCollege || candidate.privacy.hideFromCollege)) {
    blockers.push("same_college");
  }

  if (ctx.blocked?.has(candidate.id)) blockers.push("blocked");

  // ---- Score ---------------------------------------------------------------
  const reasons: string[] = [];

  const sharedValues = overlap(v.values, c.values);
  const valueScore = Math.round(30 * Math.min(1, sharedValues.length / 3));
  if (sharedValues.length >= 2) reasons.push(`You both value ${list(sharedValues.slice(0, 3))}`);

  const sharedInterests = overlap(v.interests, c.interests);
  const interestScore = Math.round(20 * Math.min(1, sharedInterests.length / 3));
  if (sharedInterests.length >= 1) reasons.push(`Both into ${list(sharedInterests.slice(0, 3))}`);

  const planReasons: string[] = [];
  const planScore = lifePlanScore(v.lifePlan, c.lifePlan, planReasons);
  reasons.push(...planReasons);

  const intentScore = intent ?? 0;
  if (v.intent === c.intent) reasons.push(`Same intent: ${INTENTS[v.intent].label.toLowerCase()}`);

  const sharedLangs = overlap(v.languages, c.languages).filter((l) => l !== "English");
  const langScore = sharedLangs.length > 0 ? 5 : 2;
  if (sharedLangs.length > 0) reasons.push(`You both speak ${list(sharedLangs.slice(0, 2))}`);

  let habitScore = 10;
  const vegLike = (d: string) => d === "veg" || d === "jain" || d === "vegan";
  if (vegLike(v.habits.diet) !== vegLike(c.habits.diet)) habitScore -= 3;
  else if (vegLike(v.habits.diet)) reasons.push("Both vegetarian");
  const gap = (x: string, y: string) => {
    const order = ["never", "socially", "often"];
    return Math.abs(order.indexOf(x) - order.indexOf(y));
  };
  habitScore -= gap(v.habits.drinks, c.habits.drinks) * 1.5;
  habitScore -= gap(v.habits.smokes, c.habits.smokes) * 2;
  habitScore = Math.max(0, Math.round(habitScore));

  if (v.hometown && v.hometown === c.hometown) reasons.unshift(`You're both from ${c.hometown}`);

  const breakdown = {
    values: valueScore,
    interests: interestScore,
    lifePlan: planScore,
    intent: intentScore,
    languages: langScore,
    habits: habitScore,
  };
  const score = Math.min(100, Object.values(breakdown).reduce((a, b) => a + b, 0));

  return { blockers, score, breakdown, reasons: reasons.slice(0, 4) };
}
