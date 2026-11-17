import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { subscribe } from "@/lib/services/plus";

export const POST = route(async (req) => {
  const { store, user } = await apiViewer();
  const { plan } = await body(req, z.object({ plan: z.enum(["plus_monthly", "plus_quarterly"]) }));
  const { renewsAt } = await subscribe(store, user, plan);
  return { ok: true, renewsAt };
});
