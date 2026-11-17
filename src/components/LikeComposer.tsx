"use client";

import { Heart, Loader2, X } from "lucide-react";
import { useState } from "react";
import { LIMITS } from "@/lib/options";

/**
 * Liking someone can carry a short note, optionally attached to one of their
 * prompts. A note gives them something to answer, which is the whole idea.
 */
export function LikeComposer({
  name,
  prompt,
  onSend,
  onClose,
}: {
  name: string;
  prompt?: { q: string; a: string };
  onSend: (note: string) => Promise<void>;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-md animate-pop rounded-t-3xl bg-card p-6 shadow-lift sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h3 className="text-2xl font-semibold">Like {name}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted hover:bg-paper-2">
            <X className="h-5 w-5" />
          </button>
        </div>
        {prompt && (
          <div className="mt-4 rounded-2xl bg-paper-2/70 p-4">
            <p className="text-xs font-semibold text-muted">{prompt.q}</p>
            <p className="mt-1 font-display text-lg leading-snug">{prompt.a}</p>
          </div>
        )}
        <label className="mt-4 block">
          <span className="label">Add a note (optional, but it helps a lot)</span>
          <textarea
            autoFocus
            className="input min-h-24"
            maxLength={LIMITS.noteMaxChars}
            placeholder={prompt ? "Reply to their answer…" : "Say something specific…"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <span className="mt-1 block text-right text-xs text-muted">
            {note.length}/{LIMITS.noteMaxChars}
          </span>
        </label>
        <button
          className="btn btn-love mt-2 w-full"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onSend(note.trim());
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />} Send like
        </button>
      </div>
    </div>
  );
}
