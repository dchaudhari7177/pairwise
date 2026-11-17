import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = { title: "Join" };

export default function JoinPage() {
  return (
    <div className="grid w-full max-w-4xl animate-rise gap-8 md:grid-cols-[1fr_1.1fr]">
      <div className="hidden md:block">
        <p className="eyebrow">Founding cohort</p>
        <h1 className="mt-3 text-4xl font-semibold leading-tight">Real people only. That starts with you.</h1>
        <ol className="mt-8 space-y-5 text-ink-2">
          {[
            ["Create your account", "Email, password and date of birth. Pairwise is strictly 18+."],
            ["Verify you're you", "Continue with eLitmus, or use your work email. Takes a minute."],
            ["Tell your story", "Your values, life plan and three prompts. No swiping on looks alone."],
            ["Meet your first five", "Picks arrive every morning, each with the reasons you might click."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-display text-sm text-paper">{i + 1}</span>
              <span>
                <span className="block font-semibold text-ink">{t}</span>
                <span className="text-sm">{d}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-8 flex items-start gap-2 rounded-2xl bg-sage-soft p-4 text-sm text-sage">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          Your dating data is never shared with eLitmus, recruiters or employers. Verification only tells us you&apos;re real.
        </p>
      </div>
      <div className="card p-7 sm:p-8">
        <h2 className="text-2xl font-semibold md:hidden">Join Pairwise</h2>
        <h2 className="hidden text-2xl font-semibold md:block">Create your account</h2>
        <SignupForm />
        <p className="mt-5 text-center text-sm text-ink-2">
          Already a member?{" "}
          <Link href="/login" className="font-semibold text-rose">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
