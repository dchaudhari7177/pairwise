// Domain model for Pairwise. Everything persisted lives here, so the shape of
// the data can be reviewed in one place.

export type Gender = "woman" | "man" | "nonbinary";
export type Intent = "long_term" | "marriage" | "figuring_out";
export type CityId = "bengaluru" | "pune" | "hyderabad" | "chennai" | "ncr" | "mumbai";

export interface LifePlan {
  /** Would you move cities for the right person? */
  relocate: "yes" | "maybe" | "no";
  /** When do you see yourself settling down? */
  timeline: "within_2y" | "2_4y" | "not_sure";
  kids: "want" | "open" | "dont_want" | "not_sure";
  /** Living arrangement after marriage, an important question in India. */
  family: "nuclear" | "joint" | "open";
}

export interface Habits {
  diet: "veg" | "nonveg" | "eggetarian" | "vegan" | "jain";
  drinks: "never" | "socially" | "often";
  smokes: "never" | "socially" | "often";
}

export interface PromptAnswer {
  q: string;
  a: string;
}

export interface Profile {
  firstName: string;
  /** ISO date (YYYY-MM-DD). Age is always derived, never stored. */
  birthDate: string;
  gender: Gender;
  interestedIn: Gender[];
  ageRange: [number, number];
  city: CityId;
  area?: string;
  hometown: string;
  languages: string[];
  heightCm?: number;
  role: string;
  intent: Intent;
  lifePlan: LifePlan;
  habits: Habits;
  values: string[];
  interests: string[];
  prompts: PromptAnswer[];
  bio?: string;
  /** Optional, display only. We never build filters on faith or community. */
  faith?: string;
  photoId?: string;
  /** Seed for the generated portrait shown when there is no photo. */
  avatarSeed: string;
}

export interface Verification {
  method: "elitmus" | "work_email" | null;
  identity: boolean;
  education?: { college: string; year: number };
  work?: { employer: string; domain: string };
  verifiedAt?: number;
}

export interface Privacy {
  /** Never show me to, or show me, people at my verified employer. */
  hideFromCompany: boolean;
  /** Same, for people from my college. */
  hideFromCollege: boolean;
  /** Photos stay blurred until we match. Enforced on the server. */
  blurPhotos: boolean;
}

export interface Consents {
  terms: boolean;
  privacy: boolean;
  /** Separate consent to process sensitive info such as orientation. */
  sensitive: boolean;
  marketing: boolean;
  at: number;
}

export type UserStatus = "active" | "paused" | "under_review" | "suspended";
export type Plan = "free" | "plus";

export interface User {
  id: string;
  email: string;
  role: "member" | "admin";
  status: UserStatus;
  plan: Plan;
  plusRenewsAt?: number;
  plusCancelAt?: number;
  /** Plus: browse the city you are moving to before you move. */
  travelCity?: CityId;
  /** Set once at sign-up (18+ check) and copied onto the profile. */
  birthDate?: string;
  createdAt: number;
  lastActiveAt: number;
  /** When the member last opened the activity feed; newer items count as unseen. */
  activitySeenAt?: number;
  onboarded: boolean;
  profile?: Profile;
  verification: Verification;
  privacy: Privacy;
  consents: Consents;
  trust: { scamFlags: number; reportsAgainst: number; warnings: number };
  /** Shown-in-picks counter, used to spread exposure fairly. */
  exposure: { week: string; count: number };
  /** Marks demo-scenario documents so the nightly reset can find them. */
  seed?: boolean;
}

export interface Credential {
  /** Document id is the lower-cased email. */
  email: string;
  uid: string;
  passwordHash: string;
}

export type LikeStatus = "pending" | "matched" | "passed";

export interface Like {
  id: string; // `${from}__${to}`
  from: string;
  to: string;
  promptIndex?: number;
  note?: string;
  createdAt: number;
  /** Inbound cap: a like may be queued and delivered on a later day. */
  deliverAt: number;
  deliverDay: string;
  status: LikeStatus;
  seed?: boolean;
}

export interface Pass {
  id: string;
  from: string;
  to: string;
  createdAt: number;
}

export interface Block {
  id: string; // `${by}__${target}`
  by: string;
  target: string;
  createdAt: number;
}

export interface SparkState {
  puzzleId: string;
  startedBy: string;
  startedAt: number;
  /** Which half of the clues each member holds. */
  roles: Record<string, "A" | "B">;
  attempts: number;
  solvedAt?: number;
  solvedBy?: string;
  played: string[];
}

export interface DatePlan {
  venueId: string;
  at: number;
  proposedBy: string;
  status: "proposed" | "accepted" | "declined";
  note?: string;
  proposedAt?: number;
  respondedAt?: number;
}

export interface Checkin {
  safe: boolean;
  again: "yes" | "maybe" | "no";
  at: number;
}

export type MatchStatus = "active" | "closed" | "expired";

export interface Match {
  id: string; // sorted pair `${a}__${b}`
  members: [string, string];
  createdAt: number;
  status: MatchStatus;
  closedBy?: string;
  closedAt?: number;
  closeReason?: "kindly" | "quietly" | "report" | "expired" | "account_deleted";
  lastMessageAt?: number;
  lastMessageBy?: string;
  lastMessagePreview?: string;
  messageCounts: Record<string, number>;
  unread: Record<string, number>;
  spark?: SparkState;
  meetReady: Record<string, boolean>;
  datePlan?: DatePlan;
  checkins?: Record<string, Checkin>;
  seed?: boolean;
}

export type ScamSignal = "money" | "crypto" | "phone" | "offplatform" | "link" | "upi";

export interface Message {
  id: string;
  matchId: string;
  from: string; // uid or "system"
  kind: "text" | "system" | "spark";
  text: string;
  createdAt: number;
  signals?: ScamSignal[];
  /** Scam Shield tip shown only to the receiver. */
  tip?: string;
  seed?: boolean;
}

export type ReportCategory =
  | "fake_profile"
  | "scam_or_money"
  | "harassment"
  | "inappropriate_content"
  | "underage"
  | "offline_behaviour"
  | "other";

export interface Report {
  id: string;
  reporter: string; // uid or "system"
  reported: string;
  matchId?: string;
  category: ReportCategory;
  details?: string;
  status: "open" | "resolved";
  resolution?: "dismissed" | "warned" | "suspended";
  resolvedBy?: string;
  resolvedAt?: number;
  createdAt: number;
  seed?: boolean;
}

export interface Payment {
  id: string;
  uid: string;
  plan: "plus_monthly" | "plus_quarterly";
  amountInr: number;
  provider: "demo";
  createdAt: number;
  seed?: boolean;
}

export interface Photo {
  id: string;
  owner: string;
  /** JPEG data URLs, resized in the browser before upload. */
  full: string;
  blur: string;
  createdAt: number;
}

export interface ShareLink {
  id: string; // random token
  matchId: string;
  uid: string;
  createdAt: number;
  expiresAt: number;
}

export interface Otp {
  id: string; // uid
  email: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
}

export interface PicksDoc {
  id: string; // `${uid}_${day}`
  uid: string;
  day: string;
  picks: { uid: string; score: number; reasons: string[] }[];
  createdAt: number;
}
