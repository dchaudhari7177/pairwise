import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { setPaused } from "@/lib/services/users";

export const POST = route(async (req) => {
  const { store, user } = await apiViewer();
  const { paused } = await body(req, z.object({ paused: z.boolean() }));
  await setPaused(store, user, paused);
  return { ok: true };
});
