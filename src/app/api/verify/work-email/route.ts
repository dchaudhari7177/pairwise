import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { startWorkEmail } from "@/lib/services/verification";

export const POST = route(async (req) => {
  const { store, user } = await apiViewer();
  const { email } = await body(req, z.object({ email: z.string().trim().max(120) }));
  return startWorkEmail(store, user, email);
});
