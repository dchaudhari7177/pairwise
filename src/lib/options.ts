import type { CityId, Gender, Habits, Intent, LifePlan } from "./types";

// Catalogues used by onboarding, profile display and matching. Keeping them
// closed lists (instead of free text) is what makes matching explainable.

export const CITIES: Record<CityId, { label: string; open: boolean }> = {
  bengaluru: { label: "Bengaluru", open: true },
  pune: { label: "Pune", open: true },
  hyderabad: { label: "Hyderabad", open: true },
  chennai: { label: "Chennai", open: false },
  ncr: { label: "Delhi NCR", open: false },
  mumbai: { label: "Mumbai", open: false },
};

export const GENDERS: Record<Gender, string> = {
  woman: "Woman",
  man: "Man",
  nonbinary: "Non-binary",
};

export const INTENTS: Record<Intent, { label: string; blurb: string }> = {
  long_term: { label: "A long-term relationship", blurb: "Looking for my person, no rush" },
  marriage: { label: "Marriage-minded", blurb: "Hoping to settle down in the next few years" },
  figuring_out: { label: "Figuring it out", blurb: "Open, but serious about real connection" },
};

export const LIFE_PLAN_LABELS: {
  [K in keyof LifePlan]: { question: string; options: Record<LifePlan[K], string> };
} = {
  relocate: {
    question: "Would you move cities for the right person?",
    options: { yes: "Yes", maybe: "Maybe", no: "I'm rooted here" },
  },
  timeline: {
    question: "When do you see yourself settling down?",
    options: { within_2y: "Within ~2 years", "2_4y": "In 2–4 years", not_sure: "Not sure yet" },
  },
  kids: {
    question: "Kids, someday?",
    options: { want: "I want kids", open: "Open to it", dont_want: "I don't want kids", not_sure: "Not sure" },
  },
  family: {
    question: "After marriage, you'd prefer to live…",
    options: { nuclear: "On our own", joint: "With family", open: "Open to either" },
  },
};

export const HABIT_LABELS: {
  [K in keyof Habits]: { question: string; options: Record<Habits[K], string> };
} = {
  diet: {
    question: "Diet",
    options: { veg: "Vegetarian", nonveg: "Non-vegetarian", eggetarian: "Eggetarian", vegan: "Vegan", jain: "Jain" },
  },
  drinks: { question: "Drinks", options: { never: "Never", socially: "Socially", often: "Often" } },
  smokes: { question: "Smokes", options: { never: "Never", socially: "Socially", often: "Often" } },
};

export const VALUES = [
  "Honesty",
  "Kindness",
  "Ambition",
  "Family",
  "Independence",
  "Humour",
  "Curiosity",
  "Faith",
  "Adventure",
  "Stability",
  "Growth",
  "Loyalty",
  "Empathy",
  "Simplicity",
] as const;

export const INTERESTS = [
  "Trekking",
  "Cooking",
  "Board games",
  "Cricket",
  "Badminton",
  "Reading",
  "Indie music",
  "Bollywood",
  "Anime",
  "Photography",
  "Running",
  "Gym",
  "Yoga",
  "Travel",
  "Gaming",
  "Side projects",
  "Stand-up comedy",
  "Café hopping",
  "Classical music",
  "Dancing",
  "Theatre",
  "Cycling",
  "Gardening",
  "Pets",
  "Volunteering",
  "Chess",
  "Football",
  "Podcasts",
  "Painting",
  "Puzzles",
] as const;

export const PROMPTS = [
  "A perfect Sunday in my city looks like…",
  "The way to win me over is…",
  "I'm weirdly good at…",
  "My most controversial food opinion…",
  "Something I learned the hard way…",
  "A green flag I look for…",
  "I moved to this city because…",
  "My family would describe me as…",
  "Two truths and a lie…",
  "The best trip I've taken…",
  "I'll know it's going well when…",
  "A puzzle I can't stop thinking about…",
] as const;

export const LANGUAGES = [
  "English",
  "Hindi",
  "Kannada",
  "Tamil",
  "Telugu",
  "Marathi",
  "Malayalam",
  "Bengali",
  "Gujarati",
  "Punjabi",
  "Odia",
] as const;

export const LIMITS = {
  freeDailyPicks: 5,
  plusDailyPicks: 10,
  freeSlots: 3,
  plusSlots: 5,
  /** New likes surfaced to any one person per day; the rest are queued. */
  inboundDailyCap: 10,
  /** A conversation with no messages for this long expires and frees the slot. */
  expiryDays: 7,
  /** "Your turn" nudge after this many hours without a reply. */
  nudgeHours: 24,
  noteMaxChars: 140,
  messageMaxChars: 1000,
};

export const PRICES = {
  plus_monthly: { inr: 299, label: "Monthly", period: "month", months: 1 },
  plus_quarterly: { inr: 699, label: "Quarterly", period: "3 months", months: 3 },
} as const;
