import { CheckCircle2, Circle, Crown, Pencil, Settings } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badges, VerifiedTick } from "@/components/Badges";
import { Avatar } from "@/components/Portrait";
import { ProfileView } from "@/components/ProfileView";
import { CITIES, INTENTS } from "@/lib/options";
import { requireMember } from "@/lib/server/viewer";
import { toCard } from "@/lib/services/profiles";

export const metadata: Metadata = { title: "My profile" };

export default async function MePage() {
  const { user } = await requireMember();
  const card = toCard(user, { self: true });
  const p = user.profile!;
  const checks = [
    { done: !!p.photoId, label: "Add a photo", hint: "Optional. Until then you show an illustrated portrait." },
    { done: !!p.bio, label: "Write a short bio" },
    { done: p.prompts.every((x) => x.a.length >= 40), label: "Give each prompt a real answer (40+ characters)" },
    { done: p.interests.length >= 5, label: "Pick at least 5 interests" },
    { done: !!user.verification.education, label: "Education verified" },
  ];
  const score = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
  const R = 34;
  const C = 2 * Math.PI * R;

  return (
    <div>
      {/* Header card */}
      <section className="card overflow-hidden">
        <div className="bg-love relative h-24 sm:h-28">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.35),transparent_60%)]" />
        </div>
        <div className="px-5 pb-5 sm:px-7">
          <div className="flex items-end justify-between gap-3">
            <div className="-mt-14 rounded-full bg-card p-1.5 shadow-lift">
              <Avatar seed={p.avatarSeed} gender={p.gender} name={p.firstName} photo={card.photo} size={104} ring={user.plan === "plus"} />
            </div>
            <div className="flex gap-2">
              <Link href="/settings" aria-label="Settings" className="btn btn-ghost btn-sm">
                <Settings className="h-4 w-4" />
              </Link>
              <Link href="/me/edit" className="btn btn-primary btn-sm">
                <Pencil className="h-4 w-4" /> Edit profile
              </Link>
            </div>
          </div>
          <h1 className="mt-4 flex items-center gap-2 text-3xl font-semibold leading-none">
            {p.firstName}, {card.age} {card.badges.identity && <VerifiedTick className="text-2xl" />}
          </h1>
          <p className="mt-2 text-sm text-ink-2">
            {p.role}
            {card.employer ? ` · ${card.employer}` : ""}
          </p>
          <p className="text-sm text-muted">
            {p.area ? `${p.area}, ` : ""}
            {CITIES[p.city].label} · {INTENTS[p.intent].label}
          </p>
          <div className="mt-4">
            <Badges card={card} />
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 md:grid-cols-[1fr_17rem]">
        {/* Strength */}
        <section className="card flex items-center gap-5 p-5">
          <div className="relative h-20 w-20 shrink-0">
            <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
              <defs>
                <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ff7a59" />
                  <stop offset="1" stopColor="#a8314a" />
                </linearGradient>
              </defs>
              <circle cx="40" cy="40" r={R} fill="none" stroke="var(--line)" strokeWidth="8" />
              <circle cx="40" cy="40" r={R} fill="none" stroke="url(#ring)" strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} />
            </svg>
            <span className="absolute inset-0 grid place-items-center font-display text-lg font-semibold">{score}%</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold">Profile strength</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {checks.map((c) => (
                <li key={c.label} className={`flex items-start gap-2 ${c.done ? "text-muted" : "text-ink-2"}`}>
                  {c.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-rose" />}
                  <span>
                    {c.label}
                    {!c.done && c.hint && <span className="block text-xs text-muted">{c.hint}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Plan */}
        <section className={`card flex flex-col justify-between p-5 ${user.plan === "plus" ? "ring-2 ring-rose/25" : ""}`}>
          <div>
            <p className="flex items-center gap-2 font-semibold">
              <Crown className="h-4 w-4 text-rose" /> {user.plan === "plus" ? "Pairwise Plus" : "Free plan"}
            </p>
            <p className="mt-1 text-sm text-ink-2">
              {user.plan === "plus" ? "10 picks a day, 5 open chats and Relocation mode." : "Everything that keeps you safe is free. Plus adds room: 10 picks, 5 chats, Relocation mode."}
            </p>
          </div>
          <Link href="/plus" className={`btn btn-sm mt-4 ${user.plan === "plus" ? "btn-ghost" : "btn-love"}`}>
            {user.plan === "plus" ? "Manage Plus" : "See Plus · ₹299/mo"}
          </Link>
        </section>
      </div>

      <div className="mb-4 mt-10 flex items-center gap-3">
        <h2 className="text-2xl font-semibold">How others see you</h2>
        <span className="h-px flex-1 bg-line" />
      </div>
      <ProfileView card={card} />
    </div>
  );
}
