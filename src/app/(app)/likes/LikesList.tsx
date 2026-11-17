"use client";

import { ChevronDown, Heart, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badges } from "@/components/Badges";
import { LikeComposer } from "@/components/LikeComposer";
import { MatchCelebration } from "@/components/MatchCelebration";
import { Portrait } from "@/components/Portrait";
import { ProfileView } from "@/components/ProfileView";
import { api } from "@/lib/client/api";
import type { ReceivedLike } from "@/lib/services/discovery";
import { timeAgo } from "@/lib/time";

export function LikesList({ likes, me }: { likes: ReceivedLike[]; me: { seed: string; name: string; values: string[]; interests: string[] } }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(likes[0]?.card.id ?? null);
  const [composing, setComposing] = useState<ReceivedLike | null>(null);
  const [match, setMatch] = useState<{ id: string; like: ReceivedLike } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shared = { values: new Set(me.values), interests: new Set(me.interests) };

  async function likeBack(l: ReceivedLike, note: string) {
    setError(null);
    try {
      const r = await api<{ matched: boolean; matchId?: string }>("/api/likes", { body: { targetId: l.card.id, note: note || undefined } });
      setComposing(null);
      if (r.matched && r.matchId) setMatch({ id: r.matchId, like: l });
      router.refresh();
    } catch (e) {
      setComposing(null);
      setError((e as Error).message);
    }
  }

  async function pass(l: ReceivedLike) {
    await api("/api/passes", { body: { targetId: l.card.id } });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-2xl bg-rose-soft p-4 text-sm text-rose-2">{error}</p>}
      {likes.map((l) => {
        const expanded = open === l.card.id;
        return (
          <div key={l.card.id} className="card overflow-hidden">
            <button className="flex w-full items-center gap-4 p-4 text-left" onClick={() => setOpen(expanded ? null : l.card.id)} aria-expanded={expanded}>
              <Portrait seed={l.card.avatarSeed} name={l.card.firstName} photo={l.card.photo} className="h-20 w-16 shrink-0" rounded="rounded-2xl" showInitial={false} />
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl font-semibold">
                  {l.card.firstName}, {l.card.age}
                </p>
                <p className="truncate text-sm text-ink-2">
                  {l.card.role} · {l.card.area ?? l.card.city}
                </p>
                {l.note ? (
                  <p className="mt-1.5 line-clamp-2 text-sm">
                    <span className="font-semibold text-rose-2">“{l.note}”</span>
                  </p>
                ) : (
                  <p className="mt-1.5 text-xs text-muted">Liked your profile · {timeAgo(l.at)}</p>
                )}
              </div>
              <ChevronDown className={`h-5 w-5 shrink-0 text-muted transition ${expanded ? "rotate-180" : ""}`} />
            </button>
            {expanded && (
              <div className="animate-rise border-t border-line p-4 sm:p-6">
                {l.prompt && (
                  <div className="mb-5 rounded-2xl bg-rose-soft/60 p-4">
                    <p className="text-xs font-semibold text-rose-2">They liked your answer to: {l.prompt.q}</p>
                    <p className="mt-1 font-display text-lg">{l.prompt.a}</p>
                    {l.note && <p className="mt-2 text-sm text-ink-2">Their note: “{l.note}”</p>}
                  </div>
                )}
                <div className="mb-4 sm:hidden">
                  <Badges card={l.card} />
                </div>
                <ProfileView card={l.card} shared={shared} reasons={l.reasons} />
                <div className="mt-6 flex gap-3">
                  <button className="btn btn-ghost flex-1" onClick={() => pass(l)}>
                    <X className="h-5 w-5" /> Not for me
                  </button>
                  <button className="btn btn-rose flex-1" onClick={() => setComposing(l)}>
                    <Heart className="h-5 w-5" /> Like back
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {composing && <LikeComposer name={composing.card.firstName} onClose={() => setComposing(null)} onSend={(n) => likeBack(composing, n)} />}
      {match && <MatchCelebration me={me} them={match.like.card} matchId={match.id} onClose={() => setMatch(null)} />}
    </div>
  );
}
