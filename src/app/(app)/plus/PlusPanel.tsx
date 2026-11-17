"use client";

import { Check, Loader2, Lock, Plane, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client/api";
import type { CityId } from "@/lib/types";

const PLANS = [
  { id: "plus_monthly", label: "Monthly", price: 299, per: "month", note: "Renews monthly. Cancel anytime." },
  { id: "plus_quarterly", label: "3 months", price: 699, per: "3 months", note: "₹233/month. Renews every 3 months.", best: true },
] as const;

export function PlusPanel({
  plan,
  renewsAt,
  cancelAt,
  travelCity,
  homeCity,
  cities,
}: {
  plan: "free" | "plus";
  renewsAt?: number;
  cancelAt?: number;
  travelCity?: CityId;
  homeCity: CityId;
  cities: { id: CityId; label: string }[];
}) {
  const router = useRouter();
  const [checkout, setCheckout] = useState<(typeof PLANS)[number] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setCheckout(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  if (plan === "plus") {
    return (
      <div className="space-y-5">
        <div className="card p-6">
          <p className="font-display text-2xl font-semibold">You&apos;re on Plus ✦</p>
          <p className="mt-1 text-ink-2">
            {cancelAt
              ? `Cancelled. Plus stays active until ${new Date(cancelAt).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}, and you won't be charged again.`
              : renewsAt
                ? `Renews on ${new Date(renewsAt).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}.`
                : "Active."}
          </p>
          {!cancelAt && (
            <button className="btn btn-ghost btn-sm mt-4" disabled={busy} onClick={() => run(() => api("/api/plus/cancel", { body: {} }))}>
              Cancel Plus
            </button>
          )}
          <p className="mt-2 text-xs text-muted">One tap, no retention maze. That&apos;s a promise.</p>
        </div>
        <div className="card p-6">
          <p className="flex items-center gap-2 font-semibold">
            <Plane className="h-5 w-5 text-rose" /> Relocation mode
          </p>
          <p className="mt-1 text-sm text-ink-2">Moving cities for work? See picks in your new city before you move.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {cities.map((c) => {
              const on = (travelCity ?? homeCity) === c.id;
              return (
                <button key={c.id} aria-pressed={on} className="toggle-chip" disabled={busy} onClick={() => run(() => api("/api/plus/travel", { body: { city: c.id === homeCity ? null : c.id } }))}>
                  {c.label}
                  {c.id === homeCity ? " (home)" : ""}
                </button>
              );
            })}
          </div>
        </div>
        {error && <p className="text-sm text-rose-2">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        {PLANS.map((p) => (
          <div key={p.id} className={`card relative p-6 ${"best" in p ? "ring-2 ring-rose/30" : ""}`}>
            {"best" in p && <span className="absolute right-4 top-4 rounded-full bg-rose-soft px-2.5 py-0.5 text-xs font-semibold text-rose-2">Best value</span>}
            <p className="text-sm font-semibold text-muted">{p.label}</p>
            <p className="mt-1 font-display text-4xl font-semibold">
              ₹{p.price}
              <span className="text-base font-normal text-muted">/{p.per}</span>
            </p>
            <p className="mt-1 text-xs text-muted">{p.note} Price includes GST.</p>
            <button className="btn btn-rose mt-5 w-full" onClick={() => setCheckout(p)}>
              Choose {p.label.toLowerCase()}
            </button>
          </div>
        ))}
      </div>

      {checkout && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setCheckout(null)}>
          <div className="w-full max-w-md animate-pop rounded-t-3xl bg-card p-6 shadow-lift sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-2xl font-semibold">Checkout</h3>
              <button onClick={() => setCheckout(null)} aria-label="Close" className="rounded-full p-1.5 text-muted hover:bg-paper-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 rounded-2xl bg-paper-2/70 p-4 text-sm">
              <div className="flex justify-between">
                <span>Pairwise Plus · {checkout.label}</span>
                <span className="font-semibold">₹{checkout.price}</span>
              </div>
              <div className="mt-1 flex justify-between text-muted">
                <span>incl. GST (18%)</span>
                <span>₹{Math.round(checkout.price - checkout.price / 1.18)}</span>
              </div>
              <p className="mt-3 text-xs text-muted">
                Renews automatically every {checkout.per} with a reminder 24 hours before each charge (RBI e-mandate rules). Cancel in one
                tap from this page.
              </p>
            </div>
            <p className="mt-4 rounded-xl bg-amber-soft px-3 py-2 text-xs text-amber">
              <Lock className="mr-1 inline h-3 w-3" /> Demo checkout: no money moves. Production uses Razorpay Subscriptions with UPI AutoPay.
            </p>
            {error && <p className="mt-2 text-sm text-rose-2">{error}</p>}
            <button className="btn btn-primary mt-4 w-full" disabled={busy} onClick={() => run(() => api("/api/plus/subscribe", { body: { plan: checkout.id } }))}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Pay ₹{checkout.price} (demo)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
