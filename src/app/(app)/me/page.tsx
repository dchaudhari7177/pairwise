import { CheckCircle2, Circle, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ProfileView } from "@/components/ProfileView";
import { requireMember } from "@/lib/server/viewer";
import { toCard } from "@/lib/services/profiles";

export const metadata: Metadata = { title: "My profile" };

export default async function MePage() {
  const { user } = await requireMember();
  const card = toCard(user, { self: true });
  const p = user.profile!;
  const checks = [
    { done: !!p.photoId, label: "Add a photo", hint: "Optional, but people are more likely to reply" },
    { done: !!p.bio, label: "Write a short bio" },
    { done: p.prompts.every((x) => x.a.length >= 40), label: "Give each prompt a real answer (40+ characters)" },
    { done: p.interests.length >= 5, label: "Pick at least 5 interests" },
    { done: !!user.verification.education, label: "Education verified" },
  ];
  const score = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">This is how others see you</p>
          <h1 className="mt-1 text-4xl font-semibold">My profile</h1>
        </div>
        <Link href="/me/edit" className="btn btn-primary">
          <Pencil className="h-4 w-4" /> Edit profile
        </Link>
      </header>

      <div className="card mb-8 p-5">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Profile strength</p>
          <p className="font-display text-2xl font-semibold text-rose">{score}%</p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-rose" style={{ width: `${score}%` }} />
        </div>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {checks.map((c) => (
            <li key={c.label} className={`flex items-start gap-2 ${c.done ? "text-muted line-through decoration-line-2" : "text-ink-2"}`}>
              {c.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sage" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0" />}
              <span>
                {c.label}
                {!c.done && c.hint && <span className="block text-xs text-muted">{c.hint}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <ProfileView card={card} />
    </div>
  );
}
