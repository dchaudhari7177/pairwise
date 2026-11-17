"use client";

import { Loader2, Puzzle, Sparkles } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/client/api";
import type { SparkView } from "@/lib/services/matches";

export function SparkPanel({ matchId, spark, otherName, active, onChange }: { matchId: string; spark: SparkView | null; otherName: string; active: boolean; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setFeedback(null);
    try {
      await api(`/api/matches/${matchId}/spark`, { body: {} });
      onChange();
    } catch (e) {
      setFeedback((e as Error).message);
    }
    setBusy(false);
  }

  async function submit(value: string) {
    if (!value) return;
    setBusy(true);
    setFeedback(null);
    try {
      const r = await api<{ correct: boolean; attempts: number }>(`/api/matches/${matchId}/spark/answer`, { body: { answer: value } });
      if (!r.correct) setFeedback(`Not quite. Compare clues with ${otherName} and try again.`);
      setAnswer("");
      onChange();
    } catch (e) {
      setFeedback((e as Error).message);
    }
    setBusy(false);
  }

  if (!spark || spark.solved) {
    return (
      <div className="space-y-4">
        {spark?.solved && (
          <div className="rounded-2xl bg-sage-soft p-4 text-sage">
            <p className="font-semibold">🎉 You solved “{spark.puzzle.title}” together.</p>
            <p className="mt-1 text-sm">The answer was {spark.puzzle.options?.find((o) => o.id === spark.answer)?.label ?? spark.answer}.</p>
          </div>
        )}
        <div className="card p-6 text-center">
          <Puzzle className="mx-auto h-9 w-9 text-rose" />
          <h3 className="mt-3 text-2xl font-semibold">{spark ? "Play another Spark?" : "Break the ice with a Spark"}</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-2">
            A two-minute puzzle for two. You each get half the clues, so you&apos;ll need to talk it through. That&apos;s the point.
          </p>
          {feedback && <p className="mt-3 text-sm text-rose-2">{feedback}</p>}
          <button className="btn btn-rose mt-5" onClick={start} disabled={busy || !active}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Start a Spark
          </button>
        </div>
      </div>
    );
  }

  const p = spark.puzzle;
  return (
    <div className="space-y-4">
      <div className="card p-5">
        <p className="eyebrow flex items-center gap-1.5 text-rose-2">
          <Puzzle className="h-3.5 w-3.5" /> Spark · {spark.startedByMe ? "you started this" : `${otherName} started this`}
        </p>
        <h3 className="mt-2 text-2xl font-semibold">{p.title}</h3>
        <p className="mt-2 text-sm text-ink-2">{p.intro}</p>
        <div className="mt-4 rounded-2xl bg-rose-soft/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-2">Your clues (only you can see these)</p>
          <ul className="mt-2 space-y-1.5">
            {p.clues.map((c) => (
              <li key={c} className="font-display text-lg leading-snug">
                • {c}
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-3 text-sm text-muted">{otherName} has the other half. Share yours in the chat and ask for theirs.</p>
      </div>

      <div className="card p-5">
        <p className="label">Your answer {spark.attempts > 0 && <span className="font-normal text-muted">· {spark.attempts} wrong guess{spark.attempts === 1 ? "" : "es"} so far</span>}</p>
        {p.kind === "choice" ? (
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {p.options!.map((o) => (
              <button key={o.id} disabled={busy} onClick={() => submit(o.id)} className="rounded-2xl border border-line-2 bg-card p-3 text-left transition hover:border-ink hover:bg-paper-2">
                <span className="block font-semibold">{o.label}</span>
                <span className="text-xs text-muted">{o.detail}</span>
              </button>
            ))}
          </div>
        ) : (
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              submit(answer);
            }}
          >
            <input className="input font-mono text-lg tracking-widest" inputMode="numeric" placeholder={`${p.range![0]}–${p.range![1]}`} value={answer} onChange={(e) => setAnswer(e.target.value.replace(/\D/g, ""))} />
            <button className="btn btn-primary" disabled={busy || !answer}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Try"}
            </button>
          </form>
        )}
        {feedback && <p className="mt-3 text-sm text-rose-2">{feedback}</p>}
      </div>
    </div>
  );
}
