"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client/api";

export function VouchForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ admitted: boolean; voucher: string }>("/api/vouches/redeem", { body: { code } });
      if (r.admitted) {
        setDone(`${r.voucher} vouched for you. Welcome in!`);
        router.push("/today");
      } else {
        setDone(`${r.voucher} vouched for you. You're now first in line.`);
      }
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
      <label className="sr-only" htmlFor="vouch">Vouch code</label>
      <input
        id="vouch"
        className="input flex-1 font-mono uppercase tracking-wider"
        placeholder="ASHA-7K2P"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        autoComplete="off"
        maxLength={11}
      />
      <button className="btn btn-love" disabled={busy || code.trim().length < 6}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Use vouch
      </button>
      {error && <p className="text-sm text-rose-2 sm:basis-full" role="alert">{error}</p>}
      {done && <p className="text-sm text-sage sm:basis-full" role="status">{done}</p>}
    </form>
  );
}
