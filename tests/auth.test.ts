import { describe, expect, it } from "vitest";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { readSession, signSession } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { MemoryStore } from "@/lib/store/memory";

describe("passwords", () => {
  it("hashes with a random salt and verifies", async () => {
    const a = await hashPassword("correct horse 42");
    const b = await hashPassword("correct horse 42");
    expect(a).not.toBe(b);
    expect(await verifyPassword("correct horse 42", a)).toBe(true);
    expect(await verifyPassword("correct horse 43", a)).toBe(false);
    expect(await verifyPassword("anything", "garbage")).toBe(false);
  });

  it("rejects weak passwords with a human reason", () => {
    expect(passwordProblem("short1")).toMatch(/8 characters/);
    expect(passwordProblem("onlyletters")).toMatch(/letters and numbers/);
    expect(passwordProblem("password123")).toMatch(/easy to guess/);
    expect(passwordProblem("monsoon2026")).toBeNull();
  });
});

describe("sessions", () => {
  it("round-trips claims and rejects tampering", async () => {
    const token = await signSession({ uid: "u1", role: "admin" });
    expect(await readSession(token)).toEqual({ uid: "u1", role: "admin" });
    const [h, p, s] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "u2", role: "admin" })).toString("base64url");
    expect(await readSession(`${h}.${forged}.${s}`)).toBeNull();
    expect(await readSession(`${h}.${p}.x${s.slice(1)}`)).toBeNull();
    expect(await readSession(undefined)).toBeNull();
  });
});

describe("rate limiting", () => {
  it("allows up to max per window, then resets", async () => {
    const store = new MemoryStore();
    for (let i = 0; i < 3; i++) await rateLimit(store, "login:a", 3, 1000, 0);
    await expect(rateLimit(store, "login:a", 3, 1000, 10)).rejects.toThrow(/Slow down/);
    await expect(rateLimit(store, "login:a", 3, 1000, 1001)).resolves.toBeUndefined();
  });
});
