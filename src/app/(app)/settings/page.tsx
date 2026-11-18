import type { Metadata } from "next";
import Link from "next/link";
import { Badges } from "@/components/Badges";
import { requireMember } from "@/lib/server/viewer";
import { toCard } from "@/lib/services/profiles";
import { SettingsPanel } from "./SettingsPanel";

export const metadata: Metadata = { title: "Settings & privacy" };

export default async function SettingsPage() {
  const { user } = await requireMember({ allowWaitlisted: true });
  const card = toCard(user, { self: true });
  return (
    <div>
      <h1 className="text-4xl font-semibold">Settings &amp; privacy</h1>
      <div className="card mt-6 p-5">
        <p className="eyebrow">Verification</p>
        <div className="mt-3">
          <Badges card={card} />
        </div>
        <p className="mt-3 text-sm text-ink-2">
          {user.verification.method === "elitmus" ? "Verified with eLitmus" : "Verified with your work email"}
          {user.verification.work ? ` · ${user.verification.work.employer}` : ""}
          {user.verification.education ? ` · ${user.verification.education.college} '${String(user.verification.education.year).slice(2)}` : ""}
        </p>
        <p className="mt-2 text-xs text-muted">Only the badges and your employer name are shown to others. Never your email or test scores.</p>
      </div>
      <div className="card mt-6 flex items-center justify-between p-5">
        <div>
          <p className="eyebrow">Plan</p>
          <p className="mt-1 font-semibold">{user.plan === "plus" ? "Pairwise Plus ✦" : "Free"}</p>
        </div>
        <Link href="/plus" className="btn btn-ghost btn-sm">
          {user.plan === "plus" ? "Manage" : "See Plus"}
        </Link>
      </div>
      <div className="mt-6">
        <SettingsPanel
          privacy={user.privacy}
          paused={user.status === "paused"}
          employer={user.verification.work?.employer}
          college={user.verification.education?.college}
          email={user.email}
        />
      </div>
      <p className="mt-8 text-center text-xs text-muted">
        Consents given {new Date(user.consents.at).toLocaleDateString("en-IN")}: terms ✓ · privacy ✓ · sensitive data {user.consents.sensitive ? "✓" : "✗"} · marketing{" "}
        {user.consents.marketing ? "✓" : "✗"}. Questions? <Link href="/legal/grievance" className="underline">Grievance officer</Link>
      </p>
    </div>
  );
}
