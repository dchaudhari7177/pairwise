"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/client/api";

const KINDS = ["Café", "Board-game café", "Bookstore café", "Dessert bar", "Workshop", "Restaurant", "Other"];

const CHECKS = [
  { key: "public", label: "Busy and public, with clear sight lines (no private booths or rooftops after dark)", required: true },
  { key: "transit", label: "Within a short walk of a metro, bus stop or auto stand", required: true },
  { key: "staffBriefed", label: "Staff know what to do if a guest says they feel unsafe", required: true },
  { key: "openLate", label: "Open until at least 9 PM", required: false },
] as const;

type Checklist = Record<(typeof CHECKS)[number]["key"], boolean>;

export function ApplyForm({ cities }: { cities: { id: string; label: string }[] }) {
  const [f, setF] = useState({ name: "", city: cities[0].id, area: "", kind: KINDS[0], contactName: "", contactEmail: "", perk: "" });
  const [checklist, setChecklist] = useState<Checklist>({ public: false, transit: false, staffBriefed: false, openLate: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  if (done) {
    return (
      <div className="card grid place-items-center p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-sage" />
        <h3 className="mt-4 text-2xl font-semibold">Thanks, {f.contactName.split(" ")[0]}.</h3>
        <p className="mt-2 max-w-sm text-ink-2">Our {cities.find((c) => c.id === f.city)?.label} lead will reach out within three working days to set up a visit.</p>
      </div>
    );
  }

  return (
    <form
      className="card space-y-4 p-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await api("/api/partners/apply", { body: { ...f, checklist } });
          setDone(true);
        } catch (err) {
          setError((err as Error).message);
        }
        setBusy(false);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="label">Venue name</span>
          <input className="input" required maxLength={60} value={f.name} onChange={set("name")} />
        </label>
        <label className="block">
          <span className="label">Type</span>
          <select className="input" value={f.kind} onChange={set("kind")}>
            {KINDS.map((k) => <option key={k}>{k}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">City</span>
          <select className="input" value={f.city} onChange={set("city")}>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="label">Area</span>
          <input className="input" required maxLength={40} placeholder="e.g. Koramangala" value={f.area} onChange={set("area")} />
        </label>
        <label className="block">
          <span className="label">Your name</span>
          <input className="input" required maxLength={50} value={f.contactName} onChange={set("contactName")} />
        </label>
        <label className="block">
          <span className="label">Work email</span>
          <input className="input" required type="email" maxLength={120} value={f.contactEmail} onChange={set("contactEmail")} />
        </label>
      </div>
      <label className="block">
        <span className="label">Perk for Pairwise couples</span>
        <input className="input" required maxLength={120} placeholder="e.g. Second coffee free" value={f.perk} onChange={set("perk")} />
      </label>
      <fieldset>
        <legend className="label">First-date safety checklist</legend>
        <div className="mt-1 space-y-2">
          {CHECKS.map((c) => (
            <label key={c.key} className="flex items-start gap-2.5 text-sm text-ink-2">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[var(--color-rose)]"
                checked={checklist[c.key]}
                onChange={(e) => setChecklist({ ...checklist, [c.key]: e.target.checked })}
              />
              <span>
                {c.label}
                {c.required ? <span className="text-rose-2"> *</span> : <span className="text-muted"> (nice to have)</span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {error && <p className="text-sm text-rose-2" role="alert">{error}</p>}
      <button className="btn btn-love w-full" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} Send application
      </button>
      <p className="text-xs text-muted">We use these details only to contact you about listing. See our <Link className="underline" href="/legal/privacy">privacy notice</Link>.</p>
    </form>
  );
}
