import { headers } from "next/headers";
import { forbidden } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { body, route, z } from "@/lib/server/api";
import { redeemPerk } from "@/lib/services/perks";
import { getStore } from "@/lib/store";
import { checkVenuePin } from "@/lib/venues";

const schema = z.object({ venueId: z.string().max(40), pin: z.string().max(12), code: z.string().max(20) });

// Public endpoint used at the venue counter. Rate-limited per IP so codes and
// PINs can't be guessed by brute force.
export const POST = route(async (req) => {
  const { venueId, pin, code } = await body(req, schema);
  const store = await getStore();
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  await rateLimit(store, `redeem:${ip}`, 20, 15 * 60 * 1000);
  if (!checkVenuePin(pin)) throw forbidden("Wrong venue PIN.", "bad_pin");
  return redeemPerk(store, venueId, code);
});
