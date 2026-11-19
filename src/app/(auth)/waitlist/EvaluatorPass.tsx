"use client";

import { Loader2, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client/api";

export function EvaluatorPass() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="mt-6 rounded-3xl border border-dashed border-line-2 bg-paper-2/60 p-6">
      <p className="eyebrow flex items-center gap-1.5">
        <Ticket className="h-3.5 w-3.5" /> Evaluating Pairwise?
      </p>
      <p className="mt-2 text-sm text-ink-2">
        You just saw the gender-balance rule work as designed. So that you can still try the rest of the app, this demo lets a fresh account
        step past the line. Your account then won&apos;t count toward the city&apos;s balance. A real launch turns this off.
      </p>
      <button
        type="button"
        className="btn btn-ghost btn-sm mt-4"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await api("/api/waitlist/evaluator-pass", { body: {} });
            router.push("/today");
            router.refresh();
          } catch (err) {
            setError((err as Error).message);
            setBusy(false);
          }
        }}
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Use the evaluator pass
      </button>
      {error && <p className="mt-2 text-sm text-rose-2" role="alert">{error}</p>}
    </div>
  );
}
