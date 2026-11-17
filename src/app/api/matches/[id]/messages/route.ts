import { LIMITS } from "@/lib/options";
import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { sendMessage } from "@/lib/services/matches";

const schema = z.object({ text: z.string().max(LIMITS.messageMaxChars), confirm: z.boolean().optional() });

export const POST = route<{ id: string }>(async (req, { id }) => {
  const { store, user } = await apiViewer();
  const { text, confirm } = await body(req, schema);
  return sendMessage(store, user, id, text, { confirm });
});
