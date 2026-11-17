import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { blockUser } from "@/lib/services/moderation";

export const POST = route(async (req) => {
  const { store, user } = await apiViewer();
  const { target } = await body(req, z.object({ target: z.string().min(1).max(80) }));
  await blockUser(store, user, target);
  return { ok: true };
});
