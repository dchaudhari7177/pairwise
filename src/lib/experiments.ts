// Randomised experiments. Assignment is a pure function of (salt, unit id),
// so it needs no storage, is stable across servers and retries, and can be
// recomputed later for analysis. Changing the salt re-randomises everyone,
// which is how a new version of an experiment starts clean.

export interface Experiment<Arm extends string = string> {
  id: string;
  title: string;
  /** The hypothesis in docs/PRODUCT.md this experiment tests. */
  hypothesis: string;
  question: string;
  /** What gets randomised. Matches, not people: a person can be in both arms across chats. */
  unit: "match" | "user";
  control: Arm;
  treatment: Arm;
  /** Share of units that get the treatment, 0–1. */
  split: number;
  salt: string;
  metric: string;
  /** Smallest absolute lift worth acting on; drives the sample-size estimate. */
  minDetectableLift: number;
  /** Outcomes are only read once a unit is this old, so young chats don't drag a rate down. */
  readAfterHours: number;
}

export const SPARK_NUDGE: Experiment<"control" | "nudge"> = {
  id: "spark_nudge",
  title: "Spark nudge on match",
  hypothesis: "H4",
  question: "Does suggesting a Spark puzzle when people match make conversations go deeper?",
  unit: "match",
  control: "control",
  treatment: "nudge",
  split: 0.5,
  salt: "spark_nudge_v1",
  metric: "Chats reaching 10+ messages",
  minDetectableLift: 0.1,
  readAfterHours: 72,
};

export const EXPERIMENTS = [SPARK_NUDGE] as const;

/** 32-bit FNV-1a. Fast, well-spread on short ids, and identical in every runtime. */
export function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A stable number in [0, 1) for this unit within this experiment. */
export function bucket(exp: Pick<Experiment, "salt">, unitId: string): number {
  return fnv1a(`${exp.salt}:${unitId}`) / 2 ** 32;
}

export function assignArm<Arm extends string>(exp: Experiment<Arm>, unitId: string): Arm {
  return bucket(exp, unitId) < exp.split ? exp.treatment : exp.control;
}

/** The chat line that is the treatment in the Spark-nudge experiment. */
export const SPARK_NUDGE_TEXT =
  "🧩 Not sure how to start? Tap Spark for a two-player puzzle. You each hold half the clues, so the only way to solve it is to talk.";
