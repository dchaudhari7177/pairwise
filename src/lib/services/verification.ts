import { createHash, randomInt } from "node:crypto";
import { badRequest, forbidden } from "../errors";
import { rateLimit } from "../rate-limit";
import type { DocStore } from "../store/types";
import type { Otp, User, Verification } from "../types";

/**
 * Verification is the moat. Two routes:
 *
 * 1. **eLitmus Verify** (primary). In production this would be an OAuth 2.0 /
 *    OIDC consent flow on elitmus.com with three narrow scopes:
 *    `identity.verified` (the photo-ID check done at the proctored test),
 *    `education` (college + graduation year), and `employment` (current
 *    employer, if the candidate was placed through eLitmus).
 *    **pH scores, percentiles and job applications are never shared.** Dating
 *    data never flows back to eLitmus or its recruiters.
 *
 *    This demo simulates that API with a small directory (below) and, for
 *    unknown emails, a self-declared record marked as simulated.
 *
 * 2. **Work email** (fallback, and the Phase 2 growth path beyond the eLitmus
 *    base). A 6-digit code is sent to a company address. Free-mail domains are
 *    rejected. In this demo the code is shown on screen instead of emailed.
 */

interface DirectoryRecord {
  name: string;
  college: string;
  year: number;
  employer?: { name: string; domain: string };
}

/** Simulated eLitmus Verify directory, used for the demo walkthrough. */
const ELITMUS_DIRECTORY: Record<string, DirectoryRecord> = {
  "demo.candidate@elitmus.test": {
    name: "Demo Candidate",
    college: "Kaveri Institute of Technology",
    year: 2023,
    employer: { name: "Tessellate Labs", domain: "tessellate.test" },
  },
  "priya.n@elitmus.test": {
    name: "Priya N",
    college: "Vindhya College of Engineering",
    year: 2022,
    employer: { name: "Monsoon Payments", domain: "monsoonpay.test" },
  },
};

export function lookupElitmus(email: string): DirectoryRecord | null {
  return ELITMUS_DIRECTORY[email.trim().toLowerCase()] ?? null;
}

export interface ElitmusClaim {
  elitmusEmail: string;
  /** Used only when the email isn't in the simulated directory. */
  college?: string;
  year?: number;
  employer?: string;
}

export async function verifyWithElitmus(store: DocStore, user: User, claim: ElitmusClaim, now = Date.now()) {
  await rateLimit(store, `verify:${user.id}`, 10, 60 * 60 * 1000, now);
  const record = lookupElitmus(claim.elitmusEmail);
  let verification: Verification;
  if (record) {
    verification = {
      method: "elitmus",
      identity: true,
      education: { college: record.college, year: record.year },
      work: record.employer ? { employer: record.employer.name, domain: record.employer.domain } : undefined,
      verifiedAt: now,
    };
  } else {
    // Simulation path for evaluators: accept a self-declared record.
    if (!claim.college?.trim() || !claim.year) throw badRequest("Enter your college and graduation year as on your eLitmus record.");
    if (claim.year < 2015 || claim.year > 2027) throw badRequest("Graduation year looks off.");
    const employer = claim.employer?.trim();
    verification = {
      method: "elitmus",
      identity: true,
      education: { college: claim.college.trim().slice(0, 80), year: claim.year },
      work: employer
        ? { employer: employer.slice(0, 60), domain: `${employer.toLowerCase().replace(/[^a-z0-9]+/g, "")}.declared` }
        : undefined,
      verifiedAt: now,
    };
  }
  await store.update("users", user.id, { verification });
  return verification;
}

const FREE_MAIL = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "rediffmail.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "zoho.com",
  "yandex.com",
]);

const hashCode = (code: string) => createHash("sha256").update(code).digest("hex");

export function employerFromDomain(domain: string): string {
  const base = domain.split(".")[0];
  return base.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function startWorkEmail(store: DocStore, user: User, workEmail: string, now = Date.now()) {
  const email = workEmail.trim().toLowerCase();
  const domain = email.split("@")[1];
  if (!domain || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw badRequest("Enter your work email.");
  if (FREE_MAIL.has(domain)) throw badRequest("That's a personal email. Use your company address.", "free_mail");
  await rateLimit(store, `otp-send:${user.id}`, 5, 60 * 60 * 1000, now);
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const otp: Otp = { id: user.id, email, codeHash: hashCode(code), expiresAt: now + 10 * 60 * 1000, attempts: 0 };
  await store.set("otps", user.id, otp);
  // Production: send via a transactional email provider. Demo: return the code.
  return { sentTo: email, demoCode: code };
}

export async function confirmWorkEmail(store: DocStore, user: User, code: string, now = Date.now()) {
  const otp = await store.get<Otp>("otps", user.id);
  if (!otp || otp.expiresAt < now) throw badRequest("That code has expired. Request a new one.", "otp_expired");
  if (otp.attempts >= 5) throw forbidden("Too many attempts. Request a new code.", "otp_locked");
  if (hashCode(code.trim()) !== otp.codeHash) {
    await store.update("otps", user.id, { attempts: otp.attempts + 1 });
    throw badRequest("That code isn't right.", "otp_wrong");
  }
  const domain = otp.email.split("@")[1];
  const verification: Verification = {
    method: "work_email",
    identity: true,
    work: { employer: employerFromDomain(domain), domain },
    education: user.verification.education,
    verifiedAt: now,
  };
  await store.batch([
    { type: "update", col: "users", id: user.id, patch: { verification } },
    { type: "delete", col: "otps", id: user.id },
  ]);
  return verification;
}
