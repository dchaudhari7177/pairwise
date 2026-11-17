import { Moon, Plane, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CITIES } from "@/lib/options";
import { requireMember } from "@/lib/server/viewer";
import { todaysPicks } from "@/lib/services/discovery";
import { formatIst } from "@/lib/time";
import { PicksDeck } from "./PicksDeck";

export const metadata: Metadata = { title: "Today" };

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { store, user } = await requireMember();
  const { welcome } = await searchParams;
  const today = await todaysPicks(store, user);
  const p = user.profile!;

  return (
    <div>
      {welcome && (
        <div className="mb-6 animate-rise rounded-3xl bg-plum p-6 text-paper">
          <p className="eyebrow text-paper/60">Welcome to Pairwise</p>
          <p className="mt-2 font-display text-2xl">Your first {today.total} picks are here.</p>
          <p className="mt-2 text-sm text-paper/75">
            Read each profile properly. Like a specific answer with a note, so they have something to reply to. New picks arrive at
            midnight.
          </p>
        </div>
      )}

      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" })}</p>
          <h1 className="mt-1 text-4xl font-semibold">Today&apos;s picks</h1>
        </div>
        <p className="text-sm text-muted">
          {today.picks.length} of {today.total} left · new picks {formatIst(today.refreshesAt, { weekday: undefined, day: undefined, month: undefined })}
        </p>
      </header>

      {user.plan === "plus" && user.travelCity && (
        <p className="mb-5 flex items-center gap-2 rounded-2xl bg-sky-soft px-4 py-3 text-sm text-[#2c5f7c]">
          <Plane className="h-4 w-4" /> Relocation mode: you&apos;re seeing people in {CITIES[user.travelCity].label}.{" "}
          <Link href="/plus" className="font-semibold underline">Change</Link>
        </p>
      )}

      {today.picks.length > 0 ? (
        <PicksDeck picks={today.picks} total={today.total} me={{ seed: p.avatarSeed, name: p.firstName, values: p.values, interests: p.interests }} />
      ) : (
        <div className="card animate-rise p-8 text-center">
          <Moon className="mx-auto h-10 w-10 text-rose" />
          <h2 className="mt-4 text-2xl font-semibold">{today.total === 0 ? "No picks yet in your city" : "That's everyone for today"}</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-2">
            {today.total === 0
              ? "We're still growing here. We'll bring you picks as soon as there are verified people who fit what you're looking for."
              : "Fewer, better picks is the point. Spend the time on your conversations. Fresh picks arrive at midnight."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/likes" className="btn btn-ghost">See who liked you</Link>
            <Link href="/chats" className="btn btn-primary">Go to chats</Link>
          </div>
          {user.plan !== "plus" && (
            <p className="mt-6 text-sm text-muted">
              <Sparkles className="mr-1 inline h-4 w-4 text-rose" />
              Plus members get 10 picks a day. <Link href="/plus" className="text-rose underline">Learn more</Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
