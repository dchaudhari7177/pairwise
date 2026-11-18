import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readSession, SESSION_COOKIE } from "../auth/session";
import { unauthorized } from "../errors";
import { settlePlan } from "../services/plus";
import { getStore } from "../store";
import type { DocStore } from "../store/types";
import type { User } from "../types";
import { touch } from "../services/users";

export interface ViewerContext {
  store: DocStore;
  user: User;
}

async function load(): Promise<ViewerContext | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const claims = await readSession(token);
  if (!claims) return null;
  const store = await getStore();
  let user = await store.get<User>("users", claims.uid);
  if (!user || user.status === "suspended") return null;
  user = await settlePlan(store, user);
  await touch(store, user);
  return { store, user };
}

/** For pages: the signed-in member, or null. */
export async function getViewer(): Promise<ViewerContext | null> {
  return load();
}

/** For app pages: redirects to login, verification or onboarding as needed. */
export async function requireMember(
  opts: { allowUnverified?: boolean; allowIncomplete?: boolean; allowWaitlisted?: boolean } = {},
): Promise<ViewerContext> {
  const ctx = await load();
  if (!ctx) redirect("/login");
  if (ctx.user.role === "admin" && !ctx.user.profile) redirect("/admin");
  if (!opts.allowUnverified && !ctx.user.verification.identity) redirect("/join/verify");
  if (!opts.allowIncomplete && !ctx.user.onboarded) redirect("/join/profile");
  if (!opts.allowWaitlisted && ctx.user.status === "waitlisted") redirect("/waitlist");
  return ctx;
}

export async function requireAdmin(): Promise<ViewerContext> {
  const ctx = await load();
  if (!ctx) redirect("/login");
  if (ctx.user.role !== "admin") redirect("/today");
  return ctx;
}

/** For API routes: throws a 401 AppError instead of redirecting. */
export async function apiViewer(): Promise<ViewerContext> {
  const ctx = await load();
  if (!ctx) throw unauthorized();
  return ctx;
}
