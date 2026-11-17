import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "pw_session";
const MAX_AGE_S = 60 * 60 * 24 * 30;

let warned = false;
function secret(): Uint8Array {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
      throw new Error("SESSION_SECRET must be set in production");
    }
    if (!warned) {
      console.warn("[pairwise] SESSION_SECRET not set; using an insecure development secret.");
      warned = true;
    }
    return new TextEncoder().encode("dev-only-secret-change-me-dev-only-secret");
  }
  return new TextEncoder().encode(value);
}

export interface SessionClaims {
  uid: string;
  role: "member" | "admin";
}

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.uid)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_S}s`)
    .sign(secret());
}

export async function readSession(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return { uid: payload.sub, role: payload.role === "admin" ? "admin" : "member" };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE_S,
};
