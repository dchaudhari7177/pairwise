"use client";

import { Heart, MessageSquareHeart, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LikeComposer } from "@/components/LikeComposer";
import { MatchCelebration } from "@/components/MatchCelebration";
import { ProfileView } from "@/components/ProfileView";
import { api, ApiError } from "@/lib/client/api";
import type { TodayPick } from "@/lib/services/discovery";

type Result = { matched: true; matchId: string } | { matched: false; queued: boolean };

export function PicksDeck({
  picks,
  total,
  me,
}: {
  picks: TodayPick[];
  total: number;
  me: { seed: string; name: string; values: string[]; interests: string[] };
}) {
  const router = useRouter();
  const [composer, setComposer] = useState<{ promptIndex?: number } | null>(null);
  const [match, setMatch] = useState<{ id: string; pick: TodayPick } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; code: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const current = picks[0];
  const shared = useMemo(() => ({ values: new Set(me.values), interests: new Set(me.interests) }), [me]);
  const currentId = current?.card.id;

  // Each new pick starts at the top, so it's read from the beginning.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentId]);

  if (!current) return null;
  const position = total - picks.length + 1;

  async function like(note: string, promptIndex?: number) {
    setError(null);
    try {
      const r = await api<Result>("/api/likes", { body: { targetId: current.card.id, note: note || undefined, promptIndex } });
      setComposer(null);
      if (r.matched) setMatch({ id: r.matchId, pick: current });
      else setToast(r.queued ? `Like sent. ${current.card.firstName}'s inbox is full today, so they'll see it tomorrow morning.` : `Like sent to ${current.card.firstName}.`);
      router.refresh();
    } catch (e) {
      setComposer(null);
      setError({ message: (e as Error).message, code: e instanceof ApiError ? e.code : "error" });
    }
  }

  async function pass() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/passes", { body: { targetId: current.card.id } });
      router.refresh();
    } catch (e) {
      setError({ message: (e as Error).message, code: "error" });
    }
    setBusy(false);
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5" aria-label={`Pick ${position} of ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < position - 1 ? "bg-ink/25" : i === position - 1 ? "bg-rose" : "bg-line"}`} />
        ))}
      </div>

      {current.likedYou && (
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-rose-soft px-3 py-1 text-sm font-semibold text-rose-2">
          <Heart className="h-4 w-4 fill-current" /> {current.card.firstName} already liked you
        </p>
      )}

      <div key={current.card.id} className="animate-rise">
        <ProfileView
          card={current.card}
          shared={shared}
          reasons={current.reasons}
          promptAction={(i) => (
            <button className="btn btn-ghost btn-sm" onClick={() => setComposer({ promptIndex: i })}>
              <MessageSquareHeart className="h-4 w-4 text-rose" /> Like this answer
            </button>
          )}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-rose/20 bg-rose-soft p-4 text-sm text-rose-2">
          {error.message}
          {error.code === "slots_full" && (
            <Link href="/chats" className="ml-1 font-semibold underline">
              Go to chats
            </Link>
          )}
        </div>
      )}

      {/* Sticky decision bar */}
      <div className="sticky bottom-20 z-20 mt-6 md:bottom-6">
        <div className="mx-auto flex max-w-md items-center gap-3 rounded-full border border-line bg-card/95 p-2 shadow-lift backdrop-blur">
          <button className="btn btn-ghost flex-1" onClick={pass} disabled={busy}>
            <X className="h-5 w-5" /> Not for me
          </button>
          <button className="btn btn-rose flex-1" onClick={() => setComposer({})}>
            <Heart className="h-5 w-5" /> {current.likedYou ? "Like back" : "Interested"}
          </button>
        </div>
      </div>

      {composer && (
        <LikeComposer
          name={current.card.firstName}
          prompt={composer.promptIndex !== undefined ? current.card.prompts[composer.promptIndex] : undefined}
          onClose={() => setComposer(null)}
          onSend={(note) => like(note, composer.promptIndex)}
        />
      )}
      {match && <MatchCelebration me={me} them={match.pick.card} matchId={match.id} onClose={() => setMatch(null)} />}
      {toast && (
        <div className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md animate-pop rounded-2xl bg-ink px-4 py-3 text-sm text-paper shadow-lift md:bottom-8" onAnimationEnd={() => setTimeout(() => setToast(null), 3500)}>
          {toast}
        </div>
      )}
    </div>
  );
}
