import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { pass } from "@/lib/services/discovery";

export const POST = route(async (req) => {
  const { store, user } = await apiViewer();
  const { targetId } = await body(req, z.object({ targetId: z.string().min(1).max(80) }));
  await pass(store, user, targetId);
  return { ok: true };
});
