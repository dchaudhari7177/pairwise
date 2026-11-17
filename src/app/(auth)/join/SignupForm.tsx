"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Field, FormError } from "@/components/forms/Field";
import { api } from "@/lib/client/api";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [sensitive, setSensitive] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { next } = await api<{ next: string }>("/api/auth/signup", {
        body: { email, password, birthDate, consents: { terms, privacy, sensitive, marketing } },
      });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const maxDob = new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().slice(0, 10);

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <Field label="Email" hint="Any email works for the account. Your work email is only for verification.">
        <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Password" hint="At least 8 characters, with letters and numbers.">
        <input className="input" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Field label="Date of birth" hint="Used to confirm you're 18+ and show your age. It can't be changed later.">
        <input className="input" type="date" required max={maxDob} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
      </Field>

      <fieldset className="space-y-1 rounded-2xl border border-line p-2">
        <legend className="px-2 text-xs font-semibold text-muted">Your consent (each one separate, as the DPDP Act requires)</legend>
        <Check checked={terms} onChange={setTerms} required>
          I agree to the <Link href="/legal/terms" target="_blank" className="underline">Terms of use</Link> and{" "}
          <Link href="/legal/guidelines" target="_blank" className="underline">Community guidelines</Link>. <span className="text-rose">*</span>
        </Check>
        <Check checked={privacy} onChange={setPrivacy} required>
          I&apos;ve read the <Link href="/legal/privacy" target="_blank" className="underline">Privacy notice</Link> and consent to Pairwise
          processing my profile to suggest matches. <span className="text-rose">*</span>
        </Check>
        <Check checked={sensitive} onChange={setSensitive}>
          I consent to Pairwise processing sensitive details I choose to share (like who I&apos;m interested in, or my faith) only for
          matching. Never for ads.
        </Check>
        <Check checked={marketing} onChange={setMarketing}>
          Send me occasional updates about new cities and events. (Optional, off by default.)
        </Check>
      </fieldset>

      <FormError message={error} />
      <button className="btn btn-rose w-full" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create account
      </button>
    </form>
  );
}
