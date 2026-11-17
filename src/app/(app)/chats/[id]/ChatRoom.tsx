"use client";

import { ArrowLeft, CalendarHeart, Flag, HeartHandshake, Loader2, MessageCircle, MoreHorizontal, Puzzle, SendHorizontal, ShieldAlert, UserRound } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { VerifiedTick } from "@/components/Badges";
import { Avatar } from "@/components/Portrait";
import { ProfileView } from "@/components/ProfileView";
import { api, ApiError } from "@/lib/client/api";
import type { Conversation } from "@/lib/services/matches";
import type { Venue } from "@/lib/venues";
import { MeetPanel } from "./MeetPanel";
import { BlockButton, CloseKindly, ReportSheet } from "./SafetyActions";
import { SparkPanel } from "./SparkPanel";

type Tab = "chat" | "spark" | "meet" | "profile";
const POLL_MS = 4000;

function time(ms: number) {
  return new Date(ms).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
}

export function ChatRoom({ initial, venues, templates }: { initial: Conversation; venues: Venue[]; templates: string[] }) {
  const [convo, setConvo] = useState(initial);
  const [tab, setTab] = useState<Tab>("chat");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [sheet, setSheet] = useState<null | { kind: "close" } | { kind: "report"; preset?: string }>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const lastCount = useRef(initial.messages.length);
  const id = convo.match.id;
  const active = convo.match.status === "active";
  const name = convo.other.firstName;

  const refresh = useCallback(async () => {
    try {
      setConvo(await api<Conversation>(`/api/matches/${id}`));
    } catch {
      /* transient network errors are fine; the next poll retries */
    }
  }, [id]);

  // Poll while the tab is visible. Cheap, robust on serverless, and good enough for chat at pilot scale.
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  useEffect(() => {
    if (tab === "chat" && convo.messages.length !== lastCount.current) {
      bottom.current?.scrollIntoView({ behavior: "smooth" });
      lastCount.current = convo.messages.length;
    }
  }, [convo.messages.length, tab]);

  useEffect(() => {
    if (tab === "chat") bottom.current?.scrollIntoView();
  }, [tab]);

  async function send(confirmed = false) {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    setError(null);
    try {
      await api(`/api/matches/${id}/messages`, { body: { text: body, confirm: confirmed } });
      setText("");
      setConfirm(null);
      await refresh();
    } catch (e) {
      if (e instanceof ApiError && e.code === "confirm_contact") setConfirm(e.message);
      else setError((e as Error).message);
    }
    setSending(false);
  }

  const sparkDot = !!convo.spark && !convo.spark.solved;
  const meetDot = convo.datePlan?.status === "proposed" && !convo.datePlan.proposedByMe;
  const TABS: { key: Tab; label: string; icon: typeof MessageCircle; dot?: boolean }[] = [
    { key: "chat", label: "Chat", icon: MessageCircle },
    { key: "spark", label: "Spark", icon: Puzzle, dot: sparkDot },
    { key: "meet", label: "Meet", icon: CalendarHeart, dot: meetDot },
    { key: "profile", label: "Profile", icon: UserRound },
  ];

  return (
    <div className="-mx-4 -mt-6 flex min-h-[calc(100dvh-7.5rem)] flex-col sm:-mx-6 md:-mt-10 md:min-h-[calc(100dvh-3rem)]">
      {/* Header */}
      <div className="sticky top-14 z-20 border-b border-line bg-paper/95 px-4 pt-3 backdrop-blur sm:px-6 md:top-0">
        <div className="flex items-center gap-3">
          <Link href="/chats" aria-label="Back to chats" className="-ml-1 rounded-full p-1.5 text-ink-2 hover:bg-paper-2">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Avatar seed={convo.other.avatarSeed} name={name} photo={convo.other.photo} size={40} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 font-semibold">
              {name} {convo.other.badges.identity && <VerifiedTick />}
            </p>
            <p className="truncate text-xs text-muted">
              {active
                ? convo.expiresInHours <= 48
                  ? `Closes in ${convo.expiresInHours}h if it stays quiet`
                  : `${convo.other.role}${convo.other.employer ? ` · ${convo.other.employer}` : ""}`
                : "Conversation closed"}
            </p>
          </div>
          <div className="relative">
            <button onClick={() => setMenu((m) => !m)} aria-label="More" className="rounded-full p-2 text-ink-2 hover:bg-paper-2">
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {menu && (
              <div className="absolute right-0 top-11 z-30 w-60 animate-pop rounded-2xl border border-line bg-card p-1.5 shadow-lift">
                {active && (
                  <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-paper-2" onClick={() => { setSheet({ kind: "close" }); setMenu(false); }}>
                    <HeartHandshake className="h-4 w-4" /> Close kindly
                  </button>
                )}
                <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-rose-2 hover:bg-rose-soft" onClick={() => { setSheet({ kind: "report" }); setMenu(false); }}>
                  <Flag className="h-4 w-4" /> Report {name}
                </button>
                <BlockButton userId={convo.other.id} name={name} />
              </div>
            )}
          </div>
        </div>
        <div className="mt-2 flex gap-1" role="tablist">
          {TABS.map(({ key, label, icon: Icon, dot }) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-2.5 text-sm font-semibold transition ${tab === key ? "border-rose text-ink" : "border-transparent text-muted hover:text-ink-2"}`}
            >
              <Icon className="h-4 w-4" /> {label}
              {dot && <span className="absolute right-[18%] top-2 h-2 w-2 rounded-full bg-rose" />}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-5 sm:px-6">
        {tab === "chat" && (
          <div className="space-y-2.5">
            {convo.messages.map((m) => {
              if (m.from === "system") {
                return (
                  <div key={m.id} className="mx-auto max-w-md py-1.5 text-center">
                    <p className={`inline-block rounded-2xl px-3.5 py-2 text-[0.8rem] leading-snug ${m.kind === "spark" ? "bg-rose-soft text-rose-2" : "bg-paper-2 text-ink-2"}`}>{m.text}</p>
                  </div>
                );
              }
              const mine = m.from === "me";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%]">
                    <div className={`rounded-3xl px-4 py-2.5 text-[0.95rem] leading-relaxed ${mine ? "rounded-br-lg bg-ink text-paper" : "rounded-bl-lg border border-line bg-card"} ${m.tip ? "ring-2 ring-amber/40" : ""}`}>
                      {m.text}
                    </div>
                    {m.tip && (
                      <div className="mt-1.5 rounded-2xl border border-amber/30 bg-amber-soft px-3 py-2 text-xs text-amber">
                        <p className="flex items-start gap-1.5">
                          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>
                            <strong>Scam Shield:</strong> {m.tip}
                          </span>
                        </p>
                        <button className="mt-1.5 font-semibold underline" onClick={() => setSheet({ kind: "report", preset: m.signals?.includes("money") || m.signals?.includes("crypto") || m.signals?.includes("upi") ? "scam_or_money" : "other" })}>
                          Report {name}
                        </button>
                      </div>
                    )}
                    <p className={`mt-0.5 px-2 text-[0.68rem] text-muted ${mine ? "text-right" : ""}`}>{time(m.at)}</p>
                  </div>
                </div>
              );
            })}
            {convo.messages.length <= 1 && active && (
              <div className="card mx-auto max-w-sm p-5 text-center">
                <Puzzle className="mx-auto h-7 w-7 text-rose" />
                <p className="mt-2 font-semibold">Not sure how to start?</p>
                <p className="mt-1 text-sm text-ink-2">Start a Spark. You&apos;ll each get half of a puzzle.</p>
                <button className="btn btn-ghost btn-sm mt-3" onClick={() => setTab("spark")}>
                  Open Spark
                </button>
              </div>
            )}
            <div ref={bottom} />
          </div>
        )}
        {tab === "spark" && <SparkPanel matchId={id} spark={convo.spark} otherName={name} active={active} onChange={refresh} />}
        {tab === "meet" && <MeetPanel convo={convo} venues={venues} onChange={refresh} />}
        {tab === "profile" && <ProfileView card={convo.other} />}
      </div>

      {/* Composer */}
      {tab === "chat" && (
        <div className="sticky bottom-16 z-20 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur sm:px-6 md:bottom-0">
          {confirm && (
            <div className="mb-3 rounded-2xl border border-amber/30 bg-amber-soft p-3 text-sm text-amber">
              <p>{confirm}</p>
              <div className="mt-2 flex gap-2">
                <button className="btn btn-primary btn-sm" onClick={() => send(true)}>Send anyway</button>
                <button className="btn btn-quiet btn-sm" onClick={() => setConfirm(null)}>Edit message</button>
              </div>
            </div>
          )}
          {error && <p className="mb-2 text-sm text-rose-2">{error}</p>}
          {active ? (
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <textarea
                rows={1}
                className="input max-h-36 min-h-[2.9rem] resize-none rounded-3xl"
                placeholder={`Message ${name}…`}
                value={text}
                maxLength={1000}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <button className="btn btn-rose h-[2.9rem] w-[2.9rem] shrink-0 p-0" aria-label="Send" disabled={sending || !text.trim()}>
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizontal className="h-5 w-5" />}
              </button>
            </form>
          ) : (
            <p className="text-center text-sm text-muted">This conversation is closed.</p>
          )}
        </div>
      )}

      {sheet?.kind === "close" && <CloseKindly matchId={id} name={name} templates={templates} onClose={() => setSheet(null)} />}
      {sheet?.kind === "report" && <ReportSheet userId={convo.other.id} matchId={id} name={name} preset={sheet.preset} onClose={() => setSheet(null)} />}
    </div>
  );
}
