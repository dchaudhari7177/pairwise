"use client";

import { Check, CheckCircle2, Copy, Loader2, Share2 } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { api } from "@/lib/client/api";
import { NOTE_MAX, QUESTIONS, type QuestionId } from "@/lib/research";

type Answers = Partial<Record<QuestionId, string | string[]>>;

const DONE_KEY = "pw_research_done";

function answeredBefore() {
  try {
    return Boolean(localStorage.getItem(DONE_KEY));
  } catch {
    return false; // storage blocked: just show the form
  }
}
const noSubscribe = () => () => {};

export function ResearchForm({ src }: { src: string }) {
  const [a, setA] = useState<Answers>({});
  const [adult, setAdult] = useState(false);
  const [note, setNote] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const already = useSyncExternalStore(noSubscribe, answeredBefore, () => false);
  const [copied, setCopied] = useState(false);

  const answered = QUESTIONS.filter((q) => {
    const v = a[q.id];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  }).length;
  const total = QUESTIONS.length;

  const pick = (id: QuestionId, value: string, max?: number) => {
    if (!max) return setA({ ...a, [id]: value });
    const cur = (a[id] as string[] | undefined) ?? [];
    if (cur.includes(value)) return setA({ ...a, [id]: cur.filter((v) => v !== value) });
    // At the limit, the newest choice replaces the oldest, so the user never hits a dead button.
    setA({ ...a, [id]: [...cur, value].slice(-max) });
  };

  const shareUrl = typeof window === "undefined" ? "" : `${window.location.origin}/research?src=friend`;

  if (done || already) {
    return (
      <div className="card p-8 text-center sm:p-10">
        <CheckCircle2 className="mx-auto h-10 w-10 text-sage" />
        <h2 className="mt-4 text-2xl font-semibold">{done ? "Thank you. That really helps." : "You've already answered. Thank you!"}</h2>
        <p className="mx-auto mt-2 max-w-md text-ink-2">
          Every answer goes straight into the founder console, split by gender, next to the hypothesis it tests. The more people
          answer, the sooner a guess becomes a decision.
        </p>
        <p className="mt-6 text-sm font-semibold">Know someone who&apos;d have an opinion?</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <a
            className="btn btn-love btn-sm"
            href={`https://wa.me/?text=${encodeURIComponent(`A 2-minute anonymous survey on what makes dating apps feel safe and worth it: ${shareUrl.replace("src=friend", "src=whatsapp")}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Share2 className="h-4 w-4" /> Share on WhatsApp
          </a>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
              } catch {
                /* clipboard blocked */
              }
            }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy link"}
          </button>
        </div>
        <p className="mt-8 text-sm text-ink-2">
          Curious what we&apos;re building? <Link href="/" className="font-semibold text-rose-2 underline">See Pairwise</Link> or read the{" "}
          <Link href="/why" className="underline">founder&apos;s notes</Link>.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const missing = QUESTIONS.find((q) => {
          const v = a[q.id];
          return Array.isArray(v) ? v.length === 0 : !v;
        });
        if (missing) {
          setError(`Please answer: “${missing.prompt}”`);
          document.getElementById(`q-${missing.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
        if (!adult) return setError("Please confirm you're 18 or older.");
        setBusy(true);
        try {
          await api("/api/research", { body: { ...a, adult, note, src, website } });
          try {
            localStorage.setItem(DONE_KEY, String(Date.now()));
          } catch {
            /* storage blocked */
          }
          setDone(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (err) {
          setError((err as Error).message);
        }
        setBusy(false);
      }}
    >
      <div className="sticky top-16 z-20 -mx-4 border-b border-line/70 bg-paper/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {answered} of {total} answered
          </span>
          <span className="text-muted">about 2 minutes</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-2" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answered}>
          <div className="h-full rounded-full bg-rose transition-all" style={{ width: `${(answered / total) * 100}%` }} />
        </div>
      </div>

      {QUESTIONS.map((q, i) => {
        const max = "max" in q ? q.max : undefined;
        const cur = a[q.id];
        return (
          <fieldset key={q.id} id={`q-${q.id}`} className="card scroll-mt-36 p-5 sm:p-6">
            <legend className="sr-only">{q.prompt}</legend>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {i + 1} / {total}
            </p>
            <p className="mt-1 text-lg font-semibold leading-snug" aria-hidden>
              {q.prompt}
            </p>
            {"hint" in q && q.hint && <p className="mt-0.5 text-sm text-ink-2">{q.hint}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {q.choices.map((c) => {
                const on = Array.isArray(cur) ? cur.includes(c.value) : cur === c.value;
                return (
                  <button key={c.value} type="button" aria-pressed={on} className="toggle-chip" onClick={() => pick(q.id, c.value, max)}>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      <div className="card p-5 sm:p-6">
        <label className="block">
          <span className="text-lg font-semibold leading-snug">Anything that would make you trust a dating app more?</span>
          <span className="mt-0.5 block text-sm text-ink-2">Optional. Please don&apos;t include names or contact details; we remove them anyway.</span>
          <textarea
            className="input mt-3 min-h-24"
            maxLength={NOTE_MAX}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Knowing the person is who they say they are"
          />
          <span className="mt-1 block text-right text-xs text-muted">
            {note.length}/{NOTE_MAX}
          </span>
        </label>
        {/* Honeypot: hidden from people, irresistible to form-filling bots. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <label className="flex items-start gap-2.5 text-sm text-ink-2">
        <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[var(--color-rose)]" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
        <span>I&apos;m 18 or older, and I understand my answers are anonymous and used only to shape Pairwise.</span>
      </label>

      {error && (
        <p className="text-sm text-rose-2" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-love w-full" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Send my answers
      </button>
    </form>
  );
}
