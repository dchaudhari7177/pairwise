import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { submitSpark } from "@/lib/services/spark";

export const POST = route<{ id: string }>(async (req, { id }) => {
  const { store, user } = await apiViewer();
  const { answer } = await body(req, z.object({ answer: z.string().trim().min(1).max(40) }));
  return submitSpark(store, user, id, answer);
});
