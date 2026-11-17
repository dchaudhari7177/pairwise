import { cookies, headers } from "next/headers";
import { signSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { signupSchema } from "@/lib/schemas";
import { body, route } from "@/lib/server/api";
import { createAccount } from "@/lib/services/users";
import { getStore } from "@/lib/store";

export const POST = route(async (req) => {
  const input = await body(req, signupSchema);
  const store = await getStore();
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  await rateLimit(store, `signup:${ip}`, 10, 60 * 60 * 1000);
  const user = await createAccount(store, input);
  (await cookies()).set(SESSION_COOKIE, await signSession({ uid: user.id, role: user.role }), sessionCookieOptions);
  return { ok: true, next: "/join/verify" };
});
