"use client";

import { Ban, Flag, HeartHandshake, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client/api";

const CATEGORIES: [string, string][] = [
  ["scam_or_money", "Asked for money / scam"],
  ["harassment", "Harassment or abusive messages"],
  ["fake_profile", "Fake profile or impersonation"],
  ["inappropriate_content", "Sexual or inappropriate content"],
  ["underage", "Might be under 18"],
  ["offline_behaviour", "Something happened when we met"],
  ["other", "Something else"],
];

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[90dvh] w-full max-w-md animate-pop overflow-y-auto rounded-t-3xl bg-card p-6 shadow-lift sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-2xl font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted hover:bg-paper-2">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function CloseKindly({ matchId, name, templates, onClose }: { matchId: string; name: string; templates: string[]; onClose: () => void }) {
  const router = useRouter();
  const [choice, setChoice] = useState(0);
  const [busy, setBusy] = useState(false);
  async function go(mode: "kindly" | "quietly") {
    setBusy(true);
    await api(`/api/matches/${matchId}/close`, { body: { mode, template: choice } });
    router.push("/chats");
    router.refresh();
  }
  return (
    <Sheet title={`Close with ${name}, kindly`} onClose={onClose}>
      <p className="text-sm text-ink-2">
        Ghosting hurts. Pick a message and we&apos;ll send it as you close the conversation. It frees a slot for both of you.
      </p>
      <div className="mt-4 space-y-2">
        {templates.map((t, i) => (
          <label key={t} className={`flex cursor-pointer gap-3 rounded-2xl border p-3 text-sm transition ${choice === i ? "border-ink bg-paper-2" : "border-line-2"}`}>
            <input type="radio" className="mt-0.5 accent-[var(--rose)]" checked={choice === i} onChange={() => setChoice(i)} />
            <span>“{t}”</span>
          </label>
        ))}
      </div>
      <button className="btn btn-primary mt-5 w-full" disabled={busy} onClick={() => go("kindly")}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <HeartHandshake className="h-4 w-4" />} Send and close
      </button>
      <button className="btn btn-quiet mt-2 w-full text-sm" disabled={busy} onClick={() => go("quietly")}>
        Close without a message
      </button>
    </Sheet>
  );
}

export function ReportSheet({ userId, matchId, name, onClose, preset }: { userId: string; matchId?: string; name: string; onClose: () => void; preset?: string }) {
  const router = useRouter();
  const [category, setCategory] = useState(preset ?? "");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ id: string }>("/api/reports", { body: { reported: userId, matchId, category, details: details || undefined } });
      setDone(r.id);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  if (done) {
    return (
      <Sheet title="Thank you for telling us" onClose={() => { router.push("/chats"); router.refresh(); }}>
        <p className="text-ink-2">
          We&apos;ve blocked {name} for you, so you won&apos;t see each other again. Our safety team will review this within 24 hours.
        </p>
        <p className="mt-3 rounded-xl bg-paper-2 p-3 font-mono text-xs text-muted">Reference: {done}</p>
        <p className="mt-3 text-sm text-ink-2">If you are in danger, call <strong>112</strong>. For cyber fraud, call <strong>1930</strong> or visit cybercrime.gov.in.</p>
        <button className="btn btn-primary mt-5 w-full" onClick={() => { router.push("/chats"); router.refresh(); }}>
          Done
        </button>
      </Sheet>
    );
  }

  return (
    <Sheet title={`Report ${name}`} onClose={onClose}>
      <p className="text-sm text-ink-2">Reports are confidential. {name} won&apos;t know it was you. Reporting also blocks them.</p>
      <div className="mt-4 space-y-1.5">
        {CATEGORIES.map(([k, label]) => (
          <label key={k} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm ${category === k ? "border-ink bg-paper-2" : "border-line"}`}>
            <input type="radio" className="accent-[var(--rose)]" checked={category === k} onChange={() => setCategory(k)} />
            {label}
          </label>
        ))}
      </div>
      <textarea className="input mt-3 min-h-20" placeholder="Anything else we should know? (optional)" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={1000} />
      {error && <p className="mt-2 text-sm text-rose-2">{error}</p>}
      <button className="btn btn-rose mt-4 w-full" disabled={!category || busy} onClick={submit}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />} Report and block
      </button>
    </Sheet>
  );
}

export function BlockButton({ userId, name }: { userId: string; name: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  if (!confirm)
    return (
      <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-paper-2" onClick={() => setConfirm(true)}>
        <Ban className="h-4 w-4" /> Block {name}
      </button>
    );
  return (
    <div className="rounded-xl bg-paper-2 p-3 text-sm">
      <p>Block {name}? You won&apos;t see each other again and this conversation closes.</p>
      <div className="mt-2 flex gap-2">
        <button
          className="btn btn-primary btn-sm"
          onClick={async () => {
            await api("/api/blocks", { body: { target: userId } });
            router.push("/chats");
            router.refresh();
          }}
        >
          Block
        </button>
        <button className="btn btn-quiet btn-sm" onClick={() => setConfirm(false)}>
          Cancel
        </button>
      </div>
    </div>
  );
}
