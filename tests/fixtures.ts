import type { Profile, User } from "@/lib/types";

let counter = 0;

export function makeUser(overrides: Partial<User> = {}, profile: Partial<Profile> = {}): User {
  counter += 1;
  const id = overrides.id ?? `u${counter}`;
  return {
    id,
    email: `${id}@test.dev`,
    role: "member",
    status: "active",
    plan: "free",
    createdAt: 0,
    lastActiveAt: Date.now(),
    onboarded: true,
    verification: {
      method: "elitmus",
      identity: true,
      education: { college: "College A", year: 2022 },
      work: { employer: "Acme", domain: `acme-${id}.test` },
    },
    privacy: { hideFromCompany: false, hideFromCollege: false, blurPhotos: false },
    consents: { terms: true, privacy: true, sensitive: true, marketing: false, at: 0 },
    trust: { scamFlags: 0, reportsAgainst: 0, warnings: 0 },
    exposure: { week: "", count: 0 },
    ...overrides,
    profile: {
      firstName: id,
      birthDate: "2000-06-15",
      gender: "woman",
      interestedIn: ["man"],
      ageRange: [22, 32],
      city: "bengaluru",
      hometown: "Mysuru",
      languages: ["English", "Kannada"],
      role: "Engineer",
      intent: "long_term",
      lifePlan: { relocate: "maybe", timeline: "2_4y", kids: "open", family: "open" },
      habits: { diet: "nonveg", drinks: "socially", smokes: "never" },
      values: ["Honesty", "Kindness", "Growth"],
      interests: ["Trekking", "Reading", "Cooking"],
      prompts: [],
      avatarSeed: id,
      ...profile,
    },
  };
}

export const woman = (o: Partial<User> = {}, p: Partial<Profile> = {}) =>
  makeUser(o, { gender: "woman", interestedIn: ["man"], ...p });
export const man = (o: Partial<User> = {}, p: Partial<Profile> = {}) =>
  makeUser(o, { gender: "man", interestedIn: ["woman"], hometown: "Indore", ...p });
