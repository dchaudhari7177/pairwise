import { route } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { createShareLink } from "@/lib/services/dates";

export const POST = route<{ id: string }>(async (req, { id }) => {
  const { store, user } = await apiViewer();
  const { token, expiresAt } = await createShareLink(store, user, id);
  return { url: `${new URL(req.url).origin}/s/${token}`, expiresAt };
});
