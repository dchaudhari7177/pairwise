import { route } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { startSpark } from "@/lib/services/spark";

export const POST = route<{ id: string }>(async (_req, { id }) => {
  const { store, user } = await apiViewer();
  return { ok: true, puzzleId: await startSpark(store, user, id) };
});
