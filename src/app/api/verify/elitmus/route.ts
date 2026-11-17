import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { verifyWithElitmus } from "@/lib/services/verification";

const schema = z.object({
  elitmusEmail: z.string().trim().email(),
  college: z.string().trim().max(80).optional(),
  year: z.number().int().optional(),
  employer: z.string().trim().max(60).optional(),
});

export const POST = route(async (req) => {
  const { store, user } = await apiViewer();
  const v = await verifyWithElitmus(store, user, await body(req, schema));
  return { ok: true, verification: v };
});
