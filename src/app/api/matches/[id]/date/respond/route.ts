import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { respondToDate } from "@/lib/services/dates";

export const POST = route<{ id: string }>(async (req, { id }) => {
  const { store, user } = await apiViewer();
  const { accept } = await body(req, z.object({ accept: z.boolean() }));
  await respondToDate(store, user, id, accept);
  return { ok: true };
});
