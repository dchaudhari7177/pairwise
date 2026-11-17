"use client";

import Link from "next/link";
import { Portrait } from "./Portrait";
import type { ProfileCard } from "@/lib/services/profiles";

export function MatchCelebration({ me, them, matchId, onClose }: { me: { seed: string; name: string }; them: ProfileCard; matchId: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-plum/80 p-4 backdrop-blur" onClick={onClose}>
      <div className="w-full max-w-sm animate-pop rounded-3xl bg-paper p-7 text-center shadow-lift" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center -space-x-6">
          <Portrait seed={me.seed} name={me.name} className="h-28 w-24 rotate-[-6deg] border-4 border-paper" rounded="rounded-2xl" />
          <Portrait seed={them.avatarSeed} name={them.firstName} photo={them.photo} className="h-28 w-24 rotate-[6deg] border-4 border-paper" rounded="rounded-2xl" />
        </div>
        <h3 className="mt-6 text-3xl font-semibold">It&apos;s mutual!</h3>
        <p className="mt-2 text-ink-2">
          You and {them.firstName} liked each other. Start a Spark puzzle together, or open with something better than &ldquo;hi&rdquo;.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href={`/chats/${matchId}`} className="btn btn-rose">
            Open the conversation
          </Link>
          <button className="btn btn-quiet" onClick={onClose}>
            Keep looking
          </button>
        </div>
      </div>
    </div>
  );
}
