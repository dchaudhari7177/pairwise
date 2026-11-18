import type { Metadata } from "next";
import { VENUES } from "@/lib/venues";
import { CITIES } from "@/lib/options";
import { RedeemForm } from "./RedeemForm";

export const metadata: Metadata = { title: "Redeem a perk code", robots: { index: false } };

export default function RedeemPage() {
  const venues = VENUES.filter((v) => v.partner).map((v) => ({ id: v.id, label: `${v.name} · ${CITIES[v.city].label}`, perk: v.perk ?? "" }));
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="eyebrow">Partner counter</p>
      <h1 className="mt-2 text-4xl font-semibold">Redeem a perk code</h1>
      <p className="mt-3 text-ink-2">
        Ask the couple for their Pairwise code. It works once, at your venue, on the day of their date. You&apos;ll see the perk to give and
        nothing else about them.
      </p>
      <RedeemForm venues={venues} />
    </div>
  );
}
