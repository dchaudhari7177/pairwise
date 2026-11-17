import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/server/viewer";
import { VerifyFlow } from "./VerifyFlow";

export const metadata: Metadata = { title: "Verify" };

export default async function VerifyPage() {
  const { user } = await requireMember({ allowUnverified: true, allowIncomplete: true });
  if (user.verification.identity) redirect(user.onboarded ? "/today" : "/join/profile");
  return (
    <div className="w-full max-w-2xl animate-rise">
      <p className="eyebrow">Step 2 of 3</p>
      <h1 className="mt-2 text-4xl font-semibold">Verify you&apos;re a real person</h1>
      <p className="mt-3 text-ink-2">
        Pairwise is verified-only, so everyone you meet has done this too. Verification confirms you&apos;re real. It doesn&apos;t
        share your private details with anyone.
      </p>
      <VerifyFlow />
    </div>
  );
}
