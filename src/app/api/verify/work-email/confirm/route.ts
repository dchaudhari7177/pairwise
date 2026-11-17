import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { confirmWorkEmail } from "@/lib/services/verification";

export const POST = route(async (req) => {
  const { store, user } = await apiViewer();
  const { code } = await body(req, z.object({ code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") }));
  return { ok: true, verification: await confirmWorkEmail(store, user, code) };
});
