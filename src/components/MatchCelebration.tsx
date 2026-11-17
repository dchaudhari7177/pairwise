"use client";

import { Heart, MessageCircle, Puzzle } from "lucide-react";
import Link from "next/link";
import type { ProfileCard } from "@/lib/services/profiles";
import type { Gender } from "@/lib/types";
import { Portrait } from "./Portrait";

const HEARTS = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${(i * 0.37) % 3}s`,
  size: 14 + ((i * 7) % 18),
}));

export function MatchCelebration({
  me,
  them,
  matchId,
  onClose,
}: {
  me: { seed: string; name: string; gender?: Gender };
  them: ProfileCard;
  matchId: string;
  onClose: () => void;
}) {
  return (
    <div className="bg-love fixed inset-0 z-50 grid place-items-center overflow-hidden p-6" role="dialog" aria-label={`It's a match with ${them.firstName}`}>
      {HEARTS.map((h, i) => (
        <Heart
          key={i}
          className="animate-float-up absolute bottom-0 fill-white/40 text-white/0"
          style={{ left: h.left, animationDelay: h.delay, width: h.size, height: h.size }}
        />
      ))}
      <div className="relative w-full max-w-sm text-center text-white">
        <div className="relative mx-auto flex h-56 w-72 justify-center">
          <Portrait seed={me.seed} name={me.name} gender={me.gender} className="absolute left-2 top-4 h-48 w-36 -rotate-[9deg] border-4 border-white shadow-lift animate-pop" rounded="rounded-[1.5rem]" />
          <Portrait
            seed={them.avatarSeed}
            name={them.firstName}
            gender={them.gender}
            photo={them.photo}
            className="absolute right-2 top-0 h-48 w-36 rotate-[8deg] border-4 border-white shadow-lift animate-pop [animation-delay:120ms]"
            rounded="rounded-[1.5rem]"
          />
          <span className="animate-heart absolute bottom-0 left-1/2 grid h-16 w-16 -translate-x-1/2 place-items-center rounded-full bg-white text-rose shadow-lift [animation-delay:350ms]">
            <Heart className="h-8 w-8 fill-current" />
          </span>
        </div>
        <h3 className="mt-8 font-display text-5xl font-semibold italic">It&apos;s mutual!</h3>
        <p className="mt-3 text-white/90">
          You and {them.firstName} like each other. Start a Spark puzzle together, or open with something better than &ldquo;hi&rdquo;.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href={`/chats/${matchId}`} className="btn w-full bg-white py-3.5 text-rose-2 shadow-lift hover:bg-paper">
            <MessageCircle className="h-5 w-5" /> Send a message
          </Link>
          <Link href={`/chats/${matchId}?tab=spark`} className="btn w-full bg-white/15 py-3.5 text-white ring-1 ring-white/40 hover:bg-white/25">
            <Puzzle className="h-5 w-5" /> Start a Spark together
          </Link>
          <button className="mt-1 text-sm font-semibold text-white/80 hover:text-white" onClick={onClose}>
            Keep browsing
          </button>
        </div>
      </div>
    </div>
  );
}
