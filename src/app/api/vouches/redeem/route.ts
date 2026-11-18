import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { redeemVouch } from "@/lib/services/launch";

export const POST = route(async (req) => {
  const { store, user } = await apiViewer();
  const { code } = await body(req, z.object({ code: z.string().min(3).max(20) }));
  return redeemVouch(store, user, code);
});
