import { z } from "zod";
import { wilson } from "./stats";

// User research: the one input the rest of the product can't fake.
//
// Every hypothesis in docs/PRODUCT.md rests on published surveys (McAfee 2026,
// Woo 2018). This short, anonymous questionnaire asks real people in the
// target segment the same questions, so the founder console can show where the
// desk research holds up and where it doesn't. Each question exists because a
// product decision depends on its answer; `informs` names that decision.
//
// It is deliberately anonymous: no name, email or IP is stored, so there is no
// personal data to protect, export or delete, and nobody hesitates to answer
// honestly about dating.

export interface Choice<V extends string = string> {
  value: V;
  label: string;
}

export interface Question<V extends string = string> {
  id: QuestionId;
  prompt: string;
  hint?: string;
  choices: readonly Choice<V>[];
  /** Pick-up-to-N questions; single choice when absent. */
  max?: number;
  /** The product decision this answer feeds. Shown in the console. */
  informs: string;
}

export const QUESTIONS = [
  {
    id: "age",
    prompt: "How old are you?",
    choices: [
      { value: "18-21", label: "18–21" },
      { value: "22-25", label: "22–25" },
      { value: "26-30", label: "26–30" },
      { value: "31+", label: "31+" },
    ],
    informs: "Who the target segment really is (we assume 22–30).",
  },
  {
    id: "gender",
    prompt: "You are…",
    choices: [
      { value: "woman", label: "A woman" },
      { value: "man", label: "A man" },
      { value: "nonbinary", label: "Non-binary" },
      { value: "na", label: "Prefer not to say" },
    ],
    informs: "Splitting every answer by gender: a two-sided market has to work for both sides.",
  },
  {
    id: "city",
    prompt: "Where do you live now?",
    choices: [
      { value: "bengaluru", label: "Bengaluru" },
      { value: "pune", label: "Pune" },
      { value: "hyderabad", label: "Hyderabad" },
      { value: "chennai", label: "Chennai" },
      { value: "ncr", label: "Delhi NCR" },
      { value: "mumbai", label: "Mumbai" },
      { value: "other", label: "Somewhere else" },
    ],
    informs: "Launch order of cities (GTM phase 0 and 1).",
  },
  {
    id: "appUse",
    prompt: "Have you used a dating app in the last year?",
    choices: [
      { value: "current", label: "Yes, I still do" },
      { value: "stopped", label: "Yes, but I stopped" },
      { value: "never", label: "No" },
    ],
    informs: "How many people the incumbents already lost, and why.",
  },
  {
    id: "pains",
    prompt: "What puts you off dating apps most?",
    hint: "Pick up to two.",
    max: 2,
    choices: [
      { value: "fake", label: "Fake profiles and scams" },
      { value: "ghosting", label: "Chats that die, or ghosting" },
      { value: "flood", label: "Too many low-effort messages" },
      { value: "silence", label: "Hardly any matches or replies" },
      { value: "privacy", label: "Colleagues or family seeing my profile" },
      { value: "casual", label: "It feels too casual" },
      { value: "matrimony", label: "Matrimony sites feel parent-led" },
    ],
    informs: "Which problem leads the pitch: trust (H1), ghosting (H3) or attention balance (H5).",
  },
  {
    id: "verified",
    prompt: "If every member were ID-verified, would you be more likely to try a dating app?",
    choices: [
      { value: "much", label: "Much more likely" },
      { value: "bit", label: "A bit more likely" },
      { value: "same", label: "No difference" },
      { value: "less", label: "Less likely" },
    ],
    informs: "H1, the core bet: verification is worth giving away because it is the product.",
  },
  {
    id: "picks",
    prompt: "Five thoughtful picks a day, or an endless feed to swipe?",
    choices: [
      { value: "picks", label: "Five picks a day" },
      { value: "either", label: "Either is fine" },
      { value: "feed", label: "An endless feed" },
    ],
    informs: "H2: whether a daily limit feels considered or just restrictive.",
  },
  {
    id: "spark",
    prompt: "Would solving a short two-player puzzle be an easier opener than “hi”?",
    choices: [
      { value: "yes", label: "Yes" },
      { value: "maybe", label: "Maybe, once" },
      { value: "no", label: "No, I'd rather just talk" },
    ],
    informs: "H4: whether Spark is a feature or a gimmick (the console's A/B test measures behaviour; this measures intent).",
  },
  {
    id: "pay",
    prompt: "The most you'd pay a month for convenience: more picks, more open chats. Safety stays free.",
    choices: [
      { value: "0", label: "Nothing" },
      { value: "99", label: "₹99" },
      { value: "199", label: "₹199" },
      { value: "299", label: "₹299" },
      { value: "499", label: "₹499 or more" },
    ],
    informs: "Plus pricing (₹299 today) and how much revenue has to come from venues instead.",
  },
] as const satisfies readonly Question[];

export type QuestionId = "age" | "gender" | "city" | "appUse" | "pains" | "verified" | "picks" | "spark" | "pay";

type ValuesOf<Q> = Q extends { choices: readonly { value: infer V }[] } ? V : never;
type QuestionById<I extends QuestionId> = Extract<(typeof QUESTIONS)[number], { id: I }>;
type Value<I extends QuestionId> = ValuesOf<QuestionById<I>>;

export const NOTE_MAX = 280;
/** Readings below this many answers are shown, but flagged as too few to act on. */
export const MIN_READING = 30;

const values = <I extends QuestionId>(id: I) =>
  (QUESTIONS.find((q) => q.id === id)!.choices as readonly { value: string }[]).map((c) => c.value) as [Value<I>, ...Value<I>[]];

/** What the browser sends. The honeypot (`website`) must stay empty. */
export const responseSchema = z.object({
  adult: z.literal(true, { message: "This survey is for people aged 18 and over." }),
  age: z.enum(values("age")),
  gender: z.enum(values("gender")),
  city: z.enum(values("city")),
  appUse: z.enum(values("appUse")),
  pains: z.array(z.enum(values("pains"))).min(1, "Pick at least one.").max(2, "Pick at most two."),
  verified: z.enum(values("verified")),
  picks: z.enum(values("picks")),
  spark: z.enum(values("spark")),
  pay: z.enum(values("pay")),
  note: z.string().trim().max(NOTE_MAX).optional().default(""),
  src: z.string().trim().max(40).optional().default(""),
  website: z.string().max(0, "Something went wrong.").optional().default(""),
});

export type ResponseInput = z.input<typeof responseSchema>;

export interface ResearchResponse {
  id: string;
  createdAt: number;
  age: Value<"age">;
  gender: Value<"gender">;
  city: Value<"city">;
  appUse: Value<"appUse">;
  pains: Value<"pains">[];
  verified: Value<"verified">;
  picks: Value<"picks">;
  spark: Value<"spark">;
  pay: Value<"pay">;
  note?: string;
  /** Which shared link brought the answer (e.g. whatsapp, linkedin): a GTM channel test. */
  src?: string;
}

/** Keep channel tags to a short slug, so a share link can't smuggle anything else in. */
export function cleanSource(raw: string | undefined | null): string {
  const s = (raw ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 20);
  return s || "direct";
}

/** Contact details don't belong in an anonymous survey: drop emails, phone numbers and handles from the note. */
export function scrubNote(note: string): string {
  return note
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[removed]")
    .replace(/(\+?\d[\d\s-]{8,}\d)/g, "[removed]")
    .replace(/(^|\s)@\w{3,}/g, "$1[removed]")
    .trim();
}

// ---------------------------------------------------------------------------
// Reading the answers.

export interface Share {
  k: number;
  n: number;
  pct: number;
  ci: [number, number];
}

const share = (k: number, n: number): Share => {
  const [lo, hi] = n ? wilson(k, n) : [0, 0];
  return { k, n, pct: n ? Math.round((k / n) * 100) : 0, ci: [Math.round(lo * 100), Math.round(hi * 100)] };
};

export interface Reading {
  id: string;
  hypothesis: string;
  /** The claim the product makes. */
  claim: string;
  /** What counts as "holds". */
  bar: number;
  all: Share;
  women: Share;
  men: Share;
  /** null while there are fewer than MIN_READING answers. */
  holds: boolean | null;
}

export interface ResearchSummary {
  n: number;
  byGender: Record<Value<"gender">, number>;
  /** Distribution per question, overall: value → count. */
  dist: Record<QuestionId, Record<string, number>>;
  readings: Reading[];
  /** Pains ranked by how many people picked them. */
  pains: { value: string; label: string; count: number; pct: number }[];
  pay: { median: number | null; atPlusPrice: Share; anything: Share };
  channels: { src: string; count: number }[];
  notes: { text: string; gender: string; createdAt: number }[];
}

const label = (id: QuestionId, value: string) =>
  (QUESTIONS.find((q) => q.id === id)!.choices as readonly Choice[]).find((c) => c.value === value)?.label ?? value;

function reading(
  rs: ResearchResponse[],
  id: string,
  hypothesis: string,
  claim: string,
  bar: number,
  test: (r: ResearchResponse) => boolean,
  among: (r: ResearchResponse) => boolean = () => true,
): Reading {
  const pool = rs.filter(among);
  const count = (xs: ResearchResponse[]) => share(xs.filter(test).length, xs.length);
  const all = count(pool);
  return {
    id,
    hypothesis,
    claim,
    bar,
    all,
    women: count(pool.filter((r) => r.gender === "woman")),
    men: count(pool.filter((r) => r.gender === "man")),
    // A reading "holds" when even the low end of the interval clears the bar, so a
    // handful of friendly answers can't declare victory.
    holds: all.n < MIN_READING ? null : all.ci[0] >= bar,
  };
}

/** Pure: turn raw answers into what the founder console shows. */
export function summarise(rs: ResearchResponse[], plusPrice = 299): ResearchSummary {
  const n = rs.length;
  const dist = Object.fromEntries(QUESTIONS.map((q) => [q.id, Object.fromEntries(q.choices.map((c) => [c.value, 0]))])) as ResearchSummary["dist"];
  for (const r of rs) {
    for (const q of QUESTIONS) {
      const v = r[q.id];
      for (const one of Array.isArray(v) ? v : [v]) if (one in dist[q.id]) dist[q.id][one]++;
    }
  }

  const readings = [
    reading(rs, "verified", "H1 · Trust", "Verification makes people more likely to try a dating app", 50, (r) => r.verified === "much" || r.verified === "bit"),
    reading(rs, "picks", "H2 · Daily Picks", "Five picks a day is preferred to, or as good as, an endless feed", 50, (r) => r.picks !== "feed"),
    reading(rs, "spark", "H4 · Spark", "A shared puzzle is an easier opener than “hi”", 40, (r) => r.spark === "yes" || r.spark === "maybe"),
    reading(
      rs,
      "lapsed",
      "Market gap",
      "Of people who used an app this year, many have already quit",
      30,
      (r) => r.appUse === "stopped",
      (r) => r.appUse !== "never",
    ),
  ];

  const pays = rs.map((r) => Number(r.pay)).sort((a, b) => a - b);
  const mid = Math.floor(pays.length / 2);
  const median = !pays.length ? null : pays.length % 2 ? pays[mid] : (pays[mid - 1] + pays[mid]) / 2;

  const channels = new Map<string, number>();
  for (const r of rs) channels.set(r.src || "direct", (channels.get(r.src || "direct") ?? 0) + 1);

  return {
    n,
    byGender: { woman: dist.gender.woman, man: dist.gender.man, nonbinary: dist.gender.nonbinary, na: dist.gender.na },
    dist,
    readings,
    pains: Object.entries(dist.pains)
      .map(([value, count]) => ({ value, label: label("pains", value), count, pct: n ? Math.round((count / n) * 100) : 0 }))
      .sort((a, b) => b.count - a.count),
    pay: {
      median,
      atPlusPrice: share(pays.filter((p) => p >= plusPrice).length, n),
      anything: share(pays.filter((p) => p > 0).length, n),
    },
    channels: [...channels].map(([src, count]) => ({ src, count })).sort((a, b) => b.count - a.count),
    notes: rs
      .filter((r) => r.note)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 6)
      .map((r) => ({ text: r.note!, gender: r.gender, createdAt: r.createdAt })),
  };
}
