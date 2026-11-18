"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/client/api";

export function RedeemForm({ venues }: { venues: { id: string; label: string; perk: string }[] }) {
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const [pin, setPin] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<{ venue: string; perk?: string } | null>(null);

  return (
    <form
      className="card mt-8 space-y-4 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        setOk(null);
        try {
          const r = await api<{ venue: string; perk?: string }>("/api/partners/redeem", { body: { venueId, pin, code } });
          setOk(r);
          setCode("");
        } catch (err) {
          setError((err as Error).message);
        }
        setBusy(false);
      }}
    >
      <label className="block">
        <span className="label">Venue</span>
        <select className="input" value={venueId} onChange={(e) => setVenueId(e.target.value)}>
          {venues.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="label">Venue PIN</span>
        <input className="input font-mono" inputMode="numeric" autoComplete="off" maxLength={12} value={pin} onChange={(e) => setPin(e.target.value)} required />
      </label>
      <label className="block">
        <span className="label">Couple&apos;s code</span>
        <input className="input font-mono uppercase tracking-widest" placeholder="PW-7Q4M2K" autoComplete="off" maxLength={10} value={code} onChange={(e) => setCode(e.target.value)} required />
      </label>
      {error && <p className="text-sm text-rose-2" role="alert">{error}</p>}
      {ok && (
        <div className="flex items-start gap-3 rounded-2xl bg-sage-soft p-4 text-sage" role="status">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Valid. Enjoy the date!</p>
            {ok.perk && <p className="text-sm">Give them: {ok.perk}</p>}
          </div>
        </div>
      )}
      <button className="btn btn-love w-full" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Check code
      </button>
    </form>
  );
}
