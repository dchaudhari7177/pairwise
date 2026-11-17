import { ageFrom } from "../time";
import type { Profile, User } from "../types";

/**
 * The only shape of another member that ever leaves the server. Email,
 * birth date, consents, trust counters and exact employer domain stay
 * private. Photos come back as a URL to the right variant (blurred or full)
 * so the browser never receives an unblurred image it shouldn't have.
 */
export interface ProfileCard {
  id: string;
  firstName: string;
  age: number;
  city: Profile["city"];
  area?: string;
  hometown: string;
  role: string;
  employer?: string;
  college?: string;
  gradYear?: number;
  badges: { identity: boolean; education: boolean; work: boolean; via: "elitmus" | "work_email" | null };
  intent: Profile["intent"];
  lifePlan: Profile["lifePlan"];
  habits: Profile["habits"];
  values: string[];
  interests: string[];
  prompts: Profile["prompts"];
  languages: string[];
  heightCm?: number;
  bio?: string;
  faith?: string;
  avatarSeed: string;
  gender: Profile["gender"];
  photo: { url: string; blurred: boolean } | null;
  plus: boolean;
}

export function toCard(user: User, opts: { matched?: boolean; self?: boolean; now?: number } = {}): ProfileCard {
  const p = user.profile!;
  const v = user.verification;
  const canSeeFull = opts.self || opts.matched || !user.privacy.blurPhotos;
  return {
    id: user.id,
    firstName: p.firstName,
    age: ageFrom(p.birthDate, opts.now),
    city: p.city,
    area: p.area,
    hometown: p.hometown,
    role: p.role,
    employer: v.work?.employer,
    college: v.education?.college,
    gradYear: v.education?.year,
    badges: { identity: v.identity, education: !!v.education, work: !!v.work, via: v.method },
    intent: p.intent,
    lifePlan: p.lifePlan,
    habits: p.habits,
    values: p.values,
    interests: p.interests,
    prompts: p.prompts,
    languages: p.languages,
    heightCm: p.heightCm,
    bio: p.bio,
    faith: p.faith,
    avatarSeed: p.avatarSeed,
    gender: p.gender,
    photo: p.photoId
      ? { url: `/api/photos/${p.photoId}?v=${canSeeFull ? "full" : "blur"}`, blurred: !canSeeFull }
      : null,
    plus: user.plan === "plus",
  };
}
