import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { closeMatch } from "@/lib/services/matches";

const schema = z.object({ mode: z.enum(["kindly", "quietly"]), template: z.number().int().min(0).max(5).optional() });

export const POST = route<{ id: string }>(async (req, { id }) => {
  const { store, user } = await apiViewer();
  const { mode, template } = await body(req, schema);
  await closeMatch(store, user, id, mode, template ?? 0);
  return { ok: true };
});
