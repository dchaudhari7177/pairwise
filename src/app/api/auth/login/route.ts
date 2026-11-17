import { cookies } from "next/headers";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/schemas";
import { body, route } from "@/lib/server/api";
import { login } from "@/lib/services/users";
import { getStore } from "@/lib/store";

export const POST = route(async (req) => {
  const { email, password } = await body(req, loginSchema);
  const store = await getStore();
  // Per-email limit: slows password guessing without letting attackers lock out a user's IP.
  await rateLimit(store, `login:${email.toLowerCase()}`, 8, 15 * 60 * 1000);
  const user = await login(store, email, password);
  (await cookies()).set(SESSION_COOKIE, await signSession({ uid: user.id, role: user.role }), sessionCookieOptions);
  const next = user.role === "admin" && !user.profile ? "/admin" : !user.verification.identity ? "/join/verify" : !user.onboarded ? "/join/profile" : "/today";
  return { ok: true, next };
});
