import { CalendarHeart, EyeOff, Flag, PhoneCall, ShieldAlert, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Safety centre" };

const TIPS = [
  ["Never send money", "No matter the story (a medical emergency, customs fees, an amazing investment), real matches don't ask for money, UPI payments, gift cards or crypto."],
  ["Take your time moving off Pairwise", "WhatsApp is fine once you trust someone. But reporting, blocking and Scam Shield only work here."],
  ["Meet in public, get there yourself", "Pick a busy place from Date Plan, arrange your own transport, and keep your phone charged."],
  ["Tell a friend", "Share your plan with someone you trust using the share link in Date Plan."],
  ["Trust your gut", "You can leave any date at any time, for any reason. You owe nobody an explanation."],
];

export default function SafetyPage() {
  return (
    <div>
      <p className="eyebrow">Safety centre</p>
      <h1 className="mt-1 text-4xl font-semibold">Safe from the first message to the first date</h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          { icon: ShieldCheck, t: "Everyone is verified", d: "Every member has passed identity verification, through eLitmus's proctored-test ID check or a work-email check." },
          { icon: ShieldAlert, t: "Scam Shield", d: "Flags money requests, UPI handles, crypto pitches and early pressure to move apps, and warns you right next to the message." },
          { icon: EyeOff, t: "Private from your world", d: "Hide from colleagues and batchmates. Keep photos blurred until you match. We enforce it on the server, not just on screen." },
          { icon: CalendarHeart, t: "Date Plan", d: "Consent before plans, public venues only, a share-with-a-friend link, and a private check-in after." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="card p-5">
            <Icon className="h-6 w-6 text-rose" />
            <p className="mt-3 font-semibold">{t}</p>
            <p className="mt-1 text-sm text-ink-2">{d}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-2xl font-semibold">Five habits that keep you safe</h2>
      <ol className="mt-4 space-y-3">
        {TIPS.map(([t, d], i) => (
          <li key={t} className="flex gap-4 rounded-2xl border border-line bg-card p-4">
            <span className="font-display text-2xl font-semibold text-rose">{i + 1}</span>
            <span>
              <span className="block font-semibold">{t}</span>
              <span className="text-sm text-ink-2">{d}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-12 rounded-3xl bg-plum p-6 text-paper">
        <p className="flex items-center gap-2 font-semibold">
          <PhoneCall className="h-5 w-5" /> If you need help right now
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-paper/85">
          <li><strong className="text-paper">112</strong>: national emergency number</li>
          <li><strong className="text-paper">181</strong>: women&apos;s helpline</li>
          <li><strong className="text-paper">1930</strong>: cyber-fraud helpline (or cybercrime.gov.in)</li>
        </ul>
      </div>

      <div className="mt-8 card p-5">
        <p className="flex items-center gap-2 font-semibold">
          <Flag className="h-5 w-5 text-rose" /> How reporting works
        </p>
        <p className="mt-2 text-sm text-ink-2">
          Report from any conversation&apos;s menu. Reporting also blocks the person instantly. Our team reviews every report within 24
          hours (complaints about intimate images are acted on immediately). Three reports from different members hide a profile
          automatically while we review it. You can also write to our{" "}
          <Link href="/legal/grievance" className="text-rose underline">grievance officer</Link>.
        </p>
      </div>
    </div>
  );
}
