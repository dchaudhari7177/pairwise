import { Check, X } from "lucide-react";
import type { Metadata } from "next";
import { CITIES } from "@/lib/options";
import { requireMember } from "@/lib/server/viewer";
import type { CityId } from "@/lib/types";
import { PlusPanel } from "./PlusPanel";

export const metadata: Metadata = { title: "Plus" };

const ROWS: [string, boolean | string, boolean | string][] = [
  ["Identity verification & badges", true, true],
  ["Scam Shield, reporting, Date Plan safety", true, true],
  ["See everyone who liked you", true, true],
  ["Spark puzzles", "Unlimited", "Unlimited"],
  ["Daily Picks", "5", "10"],
  ["Open conversation slots", "3", "5"],
  ["Relocation mode", false, true],
];

export default async function PlusPage() {
  const { user } = await requireMember();
  const cities = (Object.keys(CITIES) as CityId[]).filter((c) => CITIES[c].open).map((id) => ({ id, label: CITIES[id].label }));
  return (
    <div>
      <p className="eyebrow">Pairwise Plus</p>
      <h1 className="mt-1 text-4xl font-semibold">Convenience, not advantage</h1>
      <p className="mt-3 max-w-xl text-ink-2">
        Plus gives busy people more room: more picks, more conversations, and the ability to meet people in the city you&apos;re moving
        to. It never buys safety, visibility over others, or the list of who liked you.
      </p>

      <div className="card mt-8 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-paper-2/70 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold">&nbsp;</th>
              <th className="px-4 py-3 font-semibold">Free</th>
              <th className="px-4 py-3 font-semibold text-rose-2">Plus</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {ROWS.map(([label, free, plus]) => (
              <tr key={label}>
                <td className="px-4 py-3 text-ink-2">{label}</td>
                {[free, plus].map((v, i) => (
                  <td key={i} className="px-4 py-3 font-medium">
                    {v === true ? <Check className="h-4 w-4 text-sage" /> : v === false ? <X className="h-4 w-4 text-muted" /> : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8">
        <PlusPanel plan={user.plan} renewsAt={user.plusRenewsAt} cancelAt={user.plusCancelAt} travelCity={user.travelCity} homeCity={user.profile!.city} cities={cities} />
      </div>
    </div>
  );
}
