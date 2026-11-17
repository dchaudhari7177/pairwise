import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { resolveReport } from "@/lib/services/moderation";

export const POST = route<{ id: string }>(async (req, { id }) => {
  const { store, user } = await apiViewer();
  const { action } = await body(req, z.object({ action: z.enum(["dismissed", "warned", "suspended"]) }));
  await resolveReport(store, user, id, action);
  return { ok: true };
});
