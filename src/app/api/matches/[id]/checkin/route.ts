import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { checkIn } from "@/lib/services/dates";

const schema = z.object({ safe: z.boolean(), again: z.enum(["yes", "maybe", "no"]), details: z.string().max(1000).optional() });

export const POST = route<{ id: string }>(async (req, { id }) => {
  const { store, user } = await apiViewer();
  return { ok: true, checkin: await checkIn(store, user, id, await body(req, schema)) };
});
