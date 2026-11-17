import { route } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { getConversation } from "@/lib/services/matches";

// Polled by the chat screen every few seconds. See docs/ARCHITECTURE.md for why
// polling (not websockets) is the right call at pilot scale on serverless.
export const GET = route<{ id: string }>(async (_req, { id }) => {
  const { store, user } = await apiViewer();
  return getConversation(store, user, id);
});
