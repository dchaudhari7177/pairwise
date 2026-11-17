import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { body, route, z } from "@/lib/server/api";
import { apiViewer } from "@/lib/server/viewer";
import { deleteAccount } from "@/lib/services/account";

export const POST = route(async (req) => {
  const { store, user } = await apiViewer();
  const { password } = await body(req, z.object({ password: z.string().min(1).max(128) }));
  await deleteAccount(store, user, password);
  (await cookies()).delete(SESSION_COOKIE);
  return { ok: true };
});
