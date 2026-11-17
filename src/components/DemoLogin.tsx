"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client/api";

export interface DemoAccount {
  email: string;
  label: string;
  story: string;
}

/** One-click demo logins so evaluators can jump straight into a story. */
export function DemoLogin({ accounts, password }: { accounts: DemoAccount[]; password: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function go(email: string) {
    setBusy(email);
    setError(null);
    try {
      const { next } = await api<{ next: string }>("/api/auth/login", { body: { email, password } });
      router.push(next);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {accounts.map((a) => (
        <button
          key={a.email}
          onClick={() => go(a.email)}
          disabled={!!busy}
          className="group card flex items-start justify-between gap-3 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lift"
        >
          <span>
            <span className="block font-semibold">{a.label}</span>
            <span className="mt-0.5 block text-sm text-ink-2">{a.story}</span>
            <span className="mt-2 block font-mono text-xs text-muted">{a.email}</span>
          </span>
          {busy === a.email ? (
            <Loader2 className="mt-1 h-5 w-5 shrink-0 animate-spin text-muted" />
          ) : (
            <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-rose" />
          )}
        </button>
      ))}
      {error && <p className="text-sm text-rose sm:col-span-2">{error}</p>}
    </div>
  );
}
