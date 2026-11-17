import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { route } from "@/lib/server/api";

export const POST = route(async () => {
  (await cookies()).delete(SESSION_COOKIE);
  return { ok: true };
});
