import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { setMeetReady } from "@/lib/services/dates";

export const POST = route<{ id: string }>(async (req, { id }) => {
  const { store, user } = await apiViewer();
  const { ready } = await body(req, z.object({ ready: z.boolean() }));
  return setMeetReady(store, user, id, ready);
});
