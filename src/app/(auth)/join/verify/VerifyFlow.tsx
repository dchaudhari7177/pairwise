"use client";

import { ArrowLeft, Briefcase, Check, GraduationCap, Loader2, Mail, ShieldCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, FormError } from "@/components/forms/Field";
import { api, ApiError } from "@/lib/client/api";

type Mode = "choose" | "elitmus" | "work";

export function VerifyFlow() {
  const [mode, setMode] = useState<Mode>("choose");
  return (
    <div className="mt-8">
      {mode === "choose" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <button onClick={() => setMode("elitmus")} className="card group p-6 text-left transition hover:-translate-y-0.5 hover:shadow-lift">
            <span className="inline-flex items-center gap-2 rounded-full bg-sage-soft px-2.5 py-1 text-xs font-semibold text-sage">Recommended</span>
            <p className="mt-4 font-display text-2xl font-semibold">Continue with eLitmus</p>
            <p className="mt-2 text-sm text-ink-2">
              If you&apos;ve taken the eLitmus pH test, your identity was already checked at the test centre. One tap, and you get
              Identity, Education and Work badges.
            </p>
          </button>
          <button onClick={() => setMode("work")} className="card group p-6 text-left transition hover:-translate-y-0.5 hover:shadow-lift">
            <Mail className="h-6 w-6 text-rose" />
            <p className="mt-4 font-display text-2xl font-semibold">Use your work email</p>
            <p className="mt-2 text-sm text-ink-2">
              We send a 6-digit code to your company address. Personal email domains like Gmail don&apos;t count.
            </p>
          </button>
        </div>
      )}
      {mode === "elitmus" && <ElitmusConsent onBack={() => setMode("choose")} />}
      {mode === "work" && <WorkEmail onBack={() => setMode("choose")} />}
    </div>
  );
}

function Back({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="mb-4 inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
      <ArrowLeft className="h-4 w-4" /> Other options
    </button>
  );
}

function ElitmusConsent({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [needsRecord, setNeedsRecord] = useState(false);
  const [college, setCollege] = useState("");
  const [year, setYear] = useState("");
  const [employer, setEmployer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/verify/elitmus", {
        body: { elitmusEmail: email, ...(needsRecord ? { college, year: Number(year), employer: employer || undefined } : {}) },
      });
      router.push("/join/profile");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 400 && !needsRecord) {
        setNeedsRecord(true);
      } else {
        setError((err as Error).message);
      }
      setBusy(false);
    }
  }

  return (
    <div className="animate-rise">
      <Back onClick={onBack} />
      {/* A simulated OAuth consent screen, styled as eLitmus's page rather than ours. */}
      <div className="overflow-hidden rounded-3xl border border-line-2 bg-card shadow-lift">
        <div className="flex items-center justify-between border-b border-line bg-[#14284b] px-6 py-4 text-white">
          <span className="font-semibold tracking-tight">eLitmus · Verify</span>
          <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[0.7rem] font-semibold">Simulated for this demo</span>
        </div>
        <form onSubmit={submit} className="space-y-5 p-6">
          <p className="text-ink-2">
            <strong className="text-ink">Pairwise</strong> would like to confirm the following from your eLitmus account:
          </p>
          <ul className="space-y-2.5 text-sm">
            <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-sage" /> <span><strong>Verified identity</strong>: your photo ID was checked at the proctored pH test</span></li>
            <li className="flex gap-2"><GraduationCap className="h-4 w-4 shrink-0 text-sage" /> <span><strong>Education</strong>: college and graduation year</span></li>
            <li className="flex gap-2"><Briefcase className="h-4 w-4 shrink-0 text-sage" /> <span><strong>Employment</strong>: current employer, if you were placed through eLitmus</span></li>
          </ul>
          <div className="rounded-2xl bg-paper-2/70 p-4 text-sm">
            <p className="font-semibold">Never shared</p>
            <ul className="mt-1.5 space-y-1 text-ink-2">
              <li className="flex gap-2"><X className="h-4 w-4 shrink-0 text-rose" /> pH test scores and percentiles</li>
              <li className="flex gap-2"><X className="h-4 w-4 shrink-0 text-rose" /> Job applications and interview history</li>
              <li className="flex gap-2"><X className="h-4 w-4 shrink-0 text-rose" /> Anything back from Pairwise to eLitmus or recruiters</li>
            </ul>
          </div>

          <Field label="Email registered with eLitmus" hint={<>Demo tip: try <code>demo.candidate@elitmus.test</code>, or any email to enter your record yourself.</>}>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>

          {needsRecord && (
            <div className="space-y-4 rounded-2xl border border-amber/30 bg-amber-soft/60 p-4">
              <p className="text-sm text-amber">
                We couldn&apos;t find that email in the demo directory. In production this would just fail. For the demo, enter your
                record details and we&apos;ll mark them as simulated.
              </p>
              <Field label="College">
                <input className="input" required value={college} onChange={(e) => setCollege(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Graduation year">
                  <input className="input" type="number" min={2015} max={2027} required value={year} onChange={(e) => setYear(e.target.value)} />
                </Field>
                <Field label="Employer (optional)">
                  <input className="input" value={employer} onChange={(e) => setEmployer(e.target.value)} />
                </Field>
              </div>
            </div>
          )}

          <FormError message={error} />
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-primary" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Allow and verify
            </button>
            <button type="button" onClick={onBack} className="btn btn-quiet">Cancel</button>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <ShieldCheck className="h-3.5 w-3.5" /> In production this is a standard OAuth 2.0 consent on elitmus.com with these three narrow scopes.
          </p>
        </form>
      </div>
    </div>
  );
}

function WorkEmail({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<{ sentTo: string; demoCode: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setSent(await api<{ sentTo: string; demoCode: string }>("/api/verify/work-email", { body: { email } }));
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/verify/work-email/confirm", { body: { code } });
      router.push("/join/profile");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="card animate-rise p-6">
      <Back onClick={onBack} />
      {!sent ? (
        <form onSubmit={send} className="space-y-4">
          <Field label="Work email" hint="We only use this to confirm where you work. We never email your employer.">
            <input className="input" type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <FormError message={error} />
          <button className="btn btn-primary" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Send code
          </button>
        </form>
      ) : (
        <form onSubmit={confirm} className="space-y-4">
          <p className="text-ink-2">
            We sent a 6-digit code to <strong className="text-ink">{sent.sentTo}</strong>.
          </p>
          <p className="rounded-xl bg-amber-soft px-3 py-2 text-sm text-amber">
            Demo mode: no email is sent. Your code is <strong className="font-mono tracking-widest">{sent.demoCode}</strong>
          </p>
          <Field label="Code">
            <input className="input font-mono tracking-[0.4em]" inputMode="numeric" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          </Field>
          <FormError message={error} />
          <button className="btn btn-primary" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Verify
          </button>
        </form>
      )}
    </div>
  );
}
