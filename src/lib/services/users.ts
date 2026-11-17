import { hashPassword, passwordProblem, verifyPassword } from "../auth/password";
import { badRequest, conflict, forbidden, unauthorized } from "../errors";
import { CITIES, LIMITS } from "../options";
import type { DocStore } from "../store/types";
import { ageFrom, HOUR } from "../time";
import type { Credential, Match, Profile, User } from "../types";

export const newId = (prefix = "") =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

export async function getUser(store: DocStore, uid: string): Promise<User | null> {
  return store.get<User>("users", uid);
}

export async function requireActiveMember(store: DocStore, uid: string): Promise<User> {
  const user = await getUser(store, uid);
  if (!user) throw unauthorized();
  if (user.status === "suspended") throw forbidden("This account is suspended.", "suspended");
  return user;
}

/** Members must be verified and onboarded before they can like or message. */
export function assertCanInteract(user: User) {
  if (!user.verification.identity) throw forbidden("Verify your identity first. Pairwise is verified-only.", "not_verified");
  if (!user.onboarded || !user.profile) throw forbidden("Finish your profile first.", "not_onboarded");
  if (user.status === "paused") throw forbidden("Your profile is paused. Unpause it in Settings to continue.", "paused");
  if (user.status !== "active") throw forbidden("Your account is under review.", "under_review");
}

export interface SignupInput {
  email: string;
  password: string;
  birthDate: string;
  consents: { terms: boolean; privacy: boolean; sensitive: boolean; marketing: boolean };
}

export async function createAccount(store: DocStore, input: SignupInput, now = Date.now()): Promise<User> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw badRequest("Enter a valid email.");
  const problem = passwordProblem(input.password);
  if (problem) throw badRequest(problem, "weak_password");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)) throw badRequest("Enter your date of birth.");
  const age = ageFrom(input.birthDate, now);
  // Pairwise is strictly 18+ (IT Rules 2021, DPDP children's-data rules).
  if (age < 18) throw forbidden("Pairwise is only for people aged 18 and over.", "underage");
  if (age > 80) throw badRequest("Please check your date of birth.");
  if (!input.consents.terms || !input.consents.privacy) {
    throw badRequest("Please accept the Terms and the Privacy Notice to continue.");
  }
  if (await store.get<Credential>("credentials", email)) {
    throw conflict("An account with this email already exists. Try logging in.", "email_taken");
  }

  const uid = newId("u_");
  const user: User = {
    id: uid,
    email,
    role: "member",
    status: "active",
    plan: "free",
    createdAt: now,
    lastActiveAt: now,
    onboarded: false,
    verification: { method: null, identity: false },
    privacy: { hideFromCompany: true, hideFromCollege: false, blurPhotos: false },
    consents: { ...input.consents, at: now },
    trust: { scamFlags: 0, reportsAgainst: 0, warnings: 0 },
    exposure: { week: "", count: 0 },
    birthDate: input.birthDate,
  };
  const credential: Credential = { email, uid, passwordHash: await hashPassword(input.password) };
  await store.batch([
    { type: "set", col: "users", id: uid, data: user },
    { type: "set", col: "credentials", id: email, data: credential },
  ]);
  return user;
}

export async function login(store: DocStore, email: string, password: string): Promise<User> {
  const cred = await store.get<Credential>("credentials", email.trim().toLowerCase());
  // Verify against a dummy hash when the email is unknown, so timing doesn't leak which emails exist.
  const ok = await verifyPassword(
    password,
    cred?.passwordHash ?? "scrypt$32768$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
  );
  if (!cred || !ok) throw unauthorized("That email and password don't match.");
  const user = await getUser(store, cred.uid);
  if (!user) throw unauthorized("That email and password don't match.");
  if (user.status === "suspended") throw forbidden("This account has been suspended for breaking our community guidelines.", "suspended");
  return user;
}

/** Throttled last-active update (at most once an hour) to keep writes cheap. */
export async function touch(store: DocStore, user: User, now = Date.now()) {
  if (now - user.lastActiveAt > HOUR) await store.update("users", user.id, { lastActiveAt: now });
}

export type ProfileInput = Omit<Profile, "birthDate" | "avatarSeed" | "photoId">;

export function validateProfile(p: ProfileInput) {
  if (!p.firstName?.trim() || p.firstName.length > 30) throw badRequest("Add your first name.");
  if (!CITIES[p.city]?.open) throw badRequest("We're not open in that city yet. Join the waitlist!");
  if (!p.interestedIn?.length) throw badRequest("Tell us who you'd like to meet.");
  if (p.ageRange[0] < 18 || p.ageRange[1] > 80 || p.ageRange[0] > p.ageRange[1]) throw badRequest("Check the age range.");
  if (p.values.length < 3 || p.values.length > 5) throw badRequest("Pick 3 to 5 values.");
  if (p.interests.length < 3 || p.interests.length > 8) throw badRequest("Pick 3 to 8 interests.");
  if (p.prompts.length !== 3 || p.prompts.some((x) => !x.a.trim() || x.a.length > 200)) {
    throw badRequest("Answer three prompts (up to 200 characters each).");
  }
  if (p.languages.length < 1) throw badRequest("Pick at least one language.");
  if (p.bio && p.bio.length > 300) throw badRequest("Keep your bio under 300 characters.");
}

export async function saveProfile(store: DocStore, user: User, input: ProfileInput) {
  validateProfile(input);
  const birthDate = user.profile?.birthDate ?? user.birthDate;
  if (!birthDate) throw badRequest("Missing date of birth.");
  const profile: Profile = {
    ...input,
    firstName: input.firstName.trim(),
    birthDate,
    avatarSeed: user.profile?.avatarSeed ?? user.id,
    photoId: user.profile?.photoId,
  };
  await store.update("users", user.id, { profile, onboarded: true });
  return profile;
}

export async function updatePrivacy(store: DocStore, user: User, patch: Partial<User["privacy"]>) {
  const privacy = { ...user.privacy, ...patch };
  await store.update("users", user.id, { privacy });
  return privacy;
}

export async function setPaused(store: DocStore, user: User, paused: boolean) {
  if (user.status !== "active" && user.status !== "paused") throw forbidden("Your account is under review.");
  await store.update("users", user.id, { status: paused ? "paused" : "active" });
}

export function slotLimit(user: User) {
  return user.plan === "plus" ? LIMITS.plusSlots : LIMITS.freeSlots;
}

export function picksLimit(user: User) {
  return user.plan === "plus" ? LIMITS.plusDailyPicks : LIMITS.freeDailyPicks;
}

export function isActiveMatch(m: Match) {
  return m.status === "active";
}
