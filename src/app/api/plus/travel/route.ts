import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { setTravelCity } from "@/lib/services/plus";

export const POST = route(async (req) => {
  const { store, user } = await apiViewer();
  const { city } = await body(req, z.object({ city: z.enum(["bengaluru", "pune", "hyderabad"]).nullable() }));
  await setTravelCity(store, user, city);
  return { ok: true };
});
