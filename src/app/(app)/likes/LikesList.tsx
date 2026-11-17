"use client";

import { Heart, MessageCircleHeart, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { VerifiedTick } from "@/components/Badges";
import { LikeComposer } from "@/components/LikeComposer";
import { MatchCelebration } from "@/components/MatchCelebration";
import { Portrait } from "@/components/Portrait";
import { ProfileView } from "@/components/ProfileView";
import { api } from "@/lib/client/api";
import type { ReceivedLike } from "@/lib/services/discovery";
import { timeAgo } from "@/lib/time";
import type { Gender } from "@/lib/types";

export function LikesList({ likes, me }: { likes: ReceivedLike[]; me: { seed: string; name: string; gender: Gender; values: string[]; interests: string[] } }) {
  const router = useRouter();
  const [open, setOpen] = useState<ReceivedLike | null>(null);
  const [composing, setComposing] = useState<ReceivedLike | null>(null);
  const [match, setMatch] = useState<{ id: string; like: ReceivedLike } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shared = { values: new Set(me.values), interests: new Set(me.interests) };

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function likeBack(l: ReceivedLike, note: string) {
    setError(null);
    try {
      const r = await api<{ matched: boolean; matchId?: string }>("/api/likes", { body: { targetId: l.card.id, note: note || undefined } });
      setComposing(null);
      setOpen(null);
      if (r.matched && r.matchId) setMatch({ id: r.matchId, like: l });
      else router.refresh();
    } catch (e) {
      setComposing(null);
      setError((e as Error).message);
    }
  }

  async function pass(l: ReceivedLike) {
    setOpen(null);
    await api("/api/passes", { body: { targetId: l.card.id } });
    router.refresh();
  }

  return (
    <>
      {error && <p className="mb-4 rounded-2xl bg-rose-soft p-4 text-sm text-rose-2">{error}</p>}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {likes.map((l, i) => (
          <button
            key={l.card.id}
            onClick={() => setOpen(l)}
            className="group relative aspect-[3/4] animate-rise overflow-hidden rounded-[1.5rem] text-left shadow-soft transition hover:-translate-y-1 hover:shadow-lift"
            style={{ animationDelay: `${i * 45}ms` }}
          >
            <Portrait seed={l.card.avatarSeed} name={l.card.firstName} gender={l.card.gender} photo={l.card.photo} rounded="rounded-[1.5rem]" className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-[1.03]" />
            <span className="glass absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[0.7rem] font-bold text-ink">{l.score}%</span>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1b1015]/85 via-[#1b1015]/40 to-transparent p-3 pt-14 text-white">
              <p className="flex items-center gap-1.5 font-display text-xl font-semibold leading-none">
                {l.card.firstName} <span className="font-normal opacity-90">{l.card.age}</span>
                {l.card.badges.identity && (
                  <span className="grid h-4.5 w-4.5 place-items-center rounded-full bg-white p-px">
                    <VerifiedTick className="text-sm" />
                  </span>
                )}
              </p>
              {l.note ? (
                <p className="mt-2 line-clamp-2 rounded-xl rounded-bl-sm bg-white/95 px-2.5 py-1.5 text-xs font-medium text-ink">“{l.note}”</p>
              ) : (
                <p className="mt-1 truncate text-xs text-white/80">
                  {l.prompt ? "Liked your answer" : "Liked your profile"} · {timeAgo(l.at)}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Full-profile sheet */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setOpen(null)}>
          <div
            className="relative flex max-h-[94dvh] w-full max-w-4xl animate-pop flex-col overflow-hidden rounded-t-[2rem] bg-paper shadow-lift sm:rounded-[2rem]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label={`${open.card.firstName}'s profile`}
          >
            <button onClick={() => setOpen(null)} aria-label="Close" className="glass absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full text-ink shadow">
              <X className="h-5 w-5" />
            </button>
            <div className="overflow-y-auto p-4 pb-32 sm:p-6 sm:pb-32">
              {open.prompt && (
                <div className="mb-4 rounded-[1.5rem] bg-gradient-to-br from-rose-soft to-[#fbe9df] p-4 pr-14">
                  <p className="text-xs font-semibold text-rose-2">{open.card.firstName} liked your answer to “{open.prompt.q}”</p>
                  <p className="mt-1 font-display text-lg leading-snug">{open.prompt.a}</p>
                  {open.note && <p className="mt-2 rounded-xl bg-white px-3 py-2 text-sm text-ink">“{open.note}”</p>}
                </div>
              )}
              {!open.prompt && open.note && (
                <div className="mb-4 mr-12 rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-ink shadow-soft">
                  <p className="text-xs font-semibold text-rose-2">{open.card.firstName}&apos;s note</p>“{open.note}”
                </div>
              )}
              <ProfileView card={open.card} shared={shared} reasons={open.reasons} score={open.score} likedYou />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-5 bg-gradient-to-t from-paper via-paper/95 to-transparent pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-8">
              <button aria-label="Not for me" onClick={() => pass(open)} className="round-action h-16 w-16 bg-card text-ink shadow-lift ring-1 ring-line">
                <X className="h-7 w-7" strokeWidth={2.5} />
              </button>
              <button aria-label="Like back with a note" onClick={() => setComposing(open)} className="round-action h-12 w-12 bg-card text-rose shadow-lift ring-1 ring-line">
                <MessageCircleHeart className="h-5 w-5" />
              </button>
              <button aria-label="Like back" onClick={() => likeBack(open, "")} className="round-action btn-love h-[4.5rem] w-[4.5rem]">
                <Heart className="h-8 w-8 fill-current" />
              </button>
            </div>
          </div>
        </div>
      )}

      {composing && <LikeComposer name={composing.card.firstName} onClose={() => setComposing(null)} onSend={(n) => likeBack(composing, n)} />}
      {match && (
        <MatchCelebration
          me={me}
          them={match.like.card}
          matchId={match.id}
          onClose={() => {
            setMatch(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
