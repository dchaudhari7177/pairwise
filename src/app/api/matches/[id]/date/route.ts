import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { proposeDate } from "@/lib/services/dates";

const schema = z.object({ venueId: z.string().max(60), at: z.number().int(), note: z.string().max(140).optional() });

export const POST = route<{ id: string }>(async (req, { id }) => {
  const { store, user } = await apiViewer();
  return { ok: true, plan: await proposeDate(store, user, id, await body(req, schema)) };
});
