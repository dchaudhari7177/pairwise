import { randomUUID } from "node:crypto";
import { PRICES } from "../options";
import { cleanSource, responseSchema, scrubNote, summarise, type ResearchResponse, type ResponseInput } from "../research";
import type { DocStore } from "../store/types";
import type { User } from "../types";
import { assertAdmin } from "./moderation";

// Stored in its own collection, which the demo reset never touches: these are
// answers from real people, not part of the seeded story.
export const RESEARCH_COL = "research";

export async function submitResponse(store: DocStore, raw: ResponseInput, now = Date.now()) {
  const input = responseSchema.parse(raw);
  const note = scrubNote(input.note);
  const r: ResearchResponse = {
    id: randomUUID(),
    createdAt: now,
    age: input.age,
    gender: input.gender,
    city: input.city,
    appUse: input.appUse,
    pains: [...new Set(input.pains)],
    verified: input.verified,
    picks: input.picks,
    spark: input.spark,
    pay: input.pay,
    src: cleanSource(input.src),
    ...(note ? { note } : {}),
  };
  await store.set(RESEARCH_COL, r.id, r);
  return { ok: true as const };
}

export async function researchSummary(store: DocStore, admin: User) {
  assertAdmin(admin);
  return summarise(await store.query<ResearchResponse>(RESEARCH_COL), PRICES.plus_monthly.inr);
}
