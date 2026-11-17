import { LIMITS } from "@/lib/options";
import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { like } from "@/lib/services/discovery";

const schema = z.object({
  targetId: z.string().min(1).max(80),
  note: z.string().max(LIMITS.noteMaxChars).optional(),
  promptIndex: z.number().int().min(0).max(2).optional(),
});

export const POST = route(async (req) => {
  const { store, user } = await apiViewer();
  const { targetId, ...input } = await body(req, schema);
  return like(store, user, targetId, input);
});
