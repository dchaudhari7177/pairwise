import "server-only";
import { NextResponse } from "next/server";
import { z, ZodError, type ZodType } from "zod";
import { AppError, forbidden } from "../errors";

type Handler<P> = (req: Request, params: P) => Promise<unknown>;

/**
 * Wraps a route handler with:
 *  - a same-origin check on state-changing requests (CSRF defence in depth,
 *    on top of SameSite=Lax cookies),
 *  - uniform JSON errors: AppError → its status, Zod → 400, anything else → 500
 *    with no internals leaked.
 */
export function route<P = Record<string, string>>(handler: Handler<P>) {
  return async (req: Request, ctx: { params: Promise<P> }) => {
    try {
      if (req.method !== "GET" && req.method !== "HEAD") {
        const origin = req.headers.get("origin");
        const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
        if (origin && host && new URL(origin).host !== host) throw forbidden("Cross-site request blocked.", "csrf");
      }
      const result = await handler(req, ctx?.params ? await ctx.params : ({} as P));
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true });
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json({ error: err.message, code: err.code, ...err.extra }, { status: err.status });
      }
      if (err instanceof ZodError) {
        const first = err.issues[0];
        return NextResponse.json(
          { error: first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input.", code: "invalid" },
          { status: 400 },
        );
      }
      console.error("[pairwise] unhandled", err);
      return NextResponse.json({ error: "Something went wrong on our side. Please try again.", code: "server" }, { status: 500 });
    }
  };
}

export async function body<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    json = {};
  }
  return schema.parse(json);
}

export { z };
