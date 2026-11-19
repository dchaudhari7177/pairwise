import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import { body, route } from "@/lib/server/api";
import { responseSchema } from "@/lib/research";
import { submitResponse } from "@/lib/services/research";
import { getStore } from "@/lib/store";

export const POST = route(async (req) => {
  const input = await body(req, responseSchema);
  const store = await getStore();
  // Three answers a day per network: enough for a shared flat or office Wi-Fi,
  // too few to stuff the results. The address is hashed, never stored as is.
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = createHash("sha256").update(`research:${ip}`).digest("hex").slice(0, 24);
  await rateLimit(store, `research:${key}`, 3, 24 * 60 * 60 * 1000);
  return submitResponse(store, input);
});
