import type { DocStore } from "./store/types";
import { tooMany } from "./errors";

interface Bucket {
  count: number;
  windowStart: number;
}

/**
 * Fixed-window rate limiter stored in the document store, so limits hold
 * across serverless instances. Not perfectly atomic under heavy contention,
 * which is acceptable for abuse prevention (the goal is to stop scripts, not
 * to count exactly).
 */
export async function rateLimit(
  store: DocStore,
  key: string,
  max: number,
  windowMs: number,
  now = Date.now(),
): Promise<void> {
  const id = key.replace(/[^a-zA-Z0-9:_@.-]/g, "_").slice(0, 300);
  const bucket = await store.get<Bucket>("ratelimits", id);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    await store.set("ratelimits", id, { count: 1, windowStart: now });
    return;
  }
  if (bucket.count >= max) throw tooMany();
  await store.set("ratelimits", id, { count: bucket.count + 1, windowStart: bucket.windowStart });
}
