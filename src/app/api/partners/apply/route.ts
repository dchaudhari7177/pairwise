import { headers } from "next/headers";
import { rateLimit } from "@/lib/rate-limit";
import { body, route, z } from "@/lib/server/api";
import { applyAsVenue } from "@/lib/services/perks";
import { getStore } from "@/lib/store";
import { CITIES } from "@/lib/options";
import type { CityId } from "@/lib/types";

const schema = z.object({
  name: z.string().trim().min(2).max(60),
  city: z.enum(Object.keys(CITIES) as [CityId, ...CityId[]]),
  area: z.string().trim().min(2).max(40),
  kind: z.string().trim().min(2).max(30),
  contactName: z.string().trim().min(2).max(50),
  contactEmail: z.string().trim().email().max(120),
  perk: z.string().trim().max(120),
  checklist: z.object({ public: z.boolean(), transit: z.boolean(), staffBriefed: z.boolean(), openLate: z.boolean() }),
});

export const POST = route(async (req) => {
  const input = await body(req, schema);
  const store = await getStore();
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  await rateLimit(store, `venue-apply:${ip}`, 5, 60 * 60 * 1000);
  return applyAsVenue(store, input);
});
