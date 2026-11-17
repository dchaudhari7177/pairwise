"use client";

import { Heart, MessageCircleHeart, X } from "lucide-react";
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
  me: { seed: string; name: string; gender: TodayPick["card"]["gender"]; values: string[]; interests: string[] };
}) {
  const router = useRouter();
  const [composer, setComposer] = useState<{ promptIndex?: number } | null>(null);
  const [match, setMatch] = useState<{ id: string; pick: TodayPick } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; code: string } | null>(null);
  // Exit animation, keyed by pick so it resets automatically when the next pick arrives.
  const [exit, setExit] = useState<{ id: string; dir: "left" | "right" } | null>(null);
  const [busy, setBusy] = useState(false);
  const current = picks[0];
  const shared = useMemo(() => ({ values: new Set(me.values), interests: new Set(me.interests) }), [me]);
  const currentId = current?.card.id;

  // Each new pick starts fresh, at the top.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(t);
  }, [toast]);

  if (!current) return null;
  const leaving = exit?.id === current.card.id ? exit.dir : null;
  const position = total - picks.length + 1;

  async function like(note: string, promptIndex?: number) {
    setError(null);
    try {
      const r = await api<Result>("/api/likes", { body: { targetId: current.card.id, note: note || undefined, promptIndex } });
      setComposer(null);
      if (r.matched) {
        setMatch({ id: r.matchId, pick: current });
      } else {
        setToast(
          r.queued
            ? `Sent! ${current.card.firstName}'s inbox is full today, so they'll see it tomorrow morning.`
            : `Like sent to ${current.card.firstName} 💌`,
        );
        setExit({ id: current.card.id, dir: "right" });
        setTimeout(() => router.refresh(), 320);
      }
    } catch (e) {
      setComposer(null);
      setError({ message: (e as Error).message, code: e instanceof ApiError ? e.code : "error" });
    }
  }

  async function pass() {
    setBusy(true);
    setError(null);
    setExit({ id: current.card.id, dir: "left" });
    try {
      await api("/api/passes", { body: { targetId: current.card.id } });
      setTimeout(() => router.refresh(), 200);
    } catch (e) {
      setExit(null);
      setError({ message: (e as Error).message, code: "error" });
    }
    setBusy(false);
  }

  const actions = (
    <>
      <button
        aria-label={`Pass on ${current.card.firstName}`}
        onClick={pass}
        disabled={busy}
        className="round-action pointer-events-auto h-16 w-16 bg-card text-ink shadow-lift ring-1 ring-line"
      >
        <X className="h-7 w-7" strokeWidth={2.5} />
      </button>
      <button
        aria-label="Like with a note"
        onClick={() => setComposer({})}
        className="round-action pointer-events-auto h-12 w-12 bg-card text-rose shadow-lift ring-1 ring-line"
      >
        <MessageCircleHeart className="h-5 w-5" />
      </button>
      <button
        aria-label={current.likedYou ? `Like ${current.card.firstName} back` : `Like ${current.card.firstName}`}
        onClick={() => like("")}
        className="round-action btn-love pointer-events-auto h-[4.5rem] w-[4.5rem]"
      >
        <Heart className="h-8 w-8 fill-current" />
      </button>
    </>
  );

  return (
    <div className="pb-28 lg:pb-10">
      <div className="mb-5 flex items-center gap-1.5" aria-label={`Pick ${position} of ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i < position - 1 ? "bg-ink/20" : i === position - 1 ? "bg-love" : "bg-line"}`}
          />
        ))}
      </div>

      <div
        key={current.card.id}
        className={leaving === "left" ? "animate-out-left" : leaving === "right" ? "animate-out-right" : "animate-rise"}
      >
        <ProfileView
          card={current.card}
          shared={shared}
          reasons={current.reasons}
          score={current.score}
          likedYou={current.likedYou}
          heroFooter={<div className="flex items-center gap-5">{actions}</div>}
          promptAction={(i) => (
            <button
              aria-label={`Like ${current.card.firstName}'s answer`}
              className="round-action h-11 w-11 bg-card text-rose shadow-soft ring-1 ring-line hover:bg-rose-soft"
              onClick={() => setComposer({ promptIndex: i })}
            >
              <Heart className="h-5 w-5" />
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

      {/* Floating decision buttons (phones and tablets; on laptops they sit under the card) */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-center gap-5 md:bottom-8 md:left-64 lg:hidden">
        {actions}
      </div>

      {composer && (
        <LikeComposer
          name={current.card.firstName}
          prompt={composer.promptIndex !== undefined ? current.card.prompts[composer.promptIndex] : undefined}
          onClose={() => setComposer(null)}
          onSend={(note) => like(note, composer.promptIndex)}
        />
      )}
      {match && (
        <MatchCelebration
          me={me}
          them={match.pick.card}
          matchId={match.id}
          onClose={() => {
            setMatch(null);
            router.refresh();
          }}
        />
      )}
      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 top-20 z-50 mx-auto max-w-sm animate-pop rounded-2xl bg-ink px-4 py-3 text-center text-sm font-medium text-paper shadow-lift md:top-8 md:left-64"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
