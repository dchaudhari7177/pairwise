"use client";

import { ArrowLeft, CalendarHeart, Flag, HeartHandshake, Loader2, MessageCircle, MoreVertical, Puzzle, SendHorizontal, ShieldAlert, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { VerifiedTick } from "@/components/Badges";
import { Avatar } from "@/components/Portrait";
import { ProfileView } from "@/components/ProfileView";
import { api, ApiError } from "@/lib/client/api";
import type { ChatMessage, Conversation } from "@/lib/services/matches";
import type { Venue } from "@/lib/venues";
import { MeetPanel } from "./MeetPanel";
import { BlockButton, CloseKindly, ReportSheet } from "./SafetyActions";
import { SparkPanel } from "./SparkPanel";

type Tab = "chat" | "spark" | "meet" | "profile";
const POLL_MS = 4000;

const time = (ms: number) => new Date(ms).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
const dayKey = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

function dayLabel(ms: number) {
  const key = dayKey(ms);
  if (key === dayKey(Date.now())) return "Today";
  if (key === dayKey(Date.now() - 86400000)) return "Yesterday";
  return new Date(ms).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
}

export function ChatRoom({ initial, venues, templates, initialTab }: { initial: Conversation; venues: Venue[]; templates: string[]; initialTab?: Tab }) {
  const router = useRouter();
  const [convo, setConvo] = useState(initial);
  const [tab, setTab] = useState<Tab>(initialTab ?? "chat");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [sheet, setSheet] = useState<null | { kind: "close" } | { kind: "report"; preset?: string }>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const lastCount = useRef(-1);
  const id = convo.match.id;
  const active = convo.match.status === "active";
  const name = convo.other.firstName;
  const other = convo.other;

  const refresh = useCallback(async () => {
    try {
      setConvo(await api<Conversation>(`/api/matches/${id}`));
    } catch {
      /* transient network errors are fine; the next poll retries */
    }
  }, [id]);

  // Poll while visible: robust on serverless, and good enough for chat at pilot scale.
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && refresh(), POLL_MS);
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  useEffect(() => {
    if (tab !== "chat") return;
    const el = scroller.current;
    if (!el) return;
    const first = lastCount.current === -1;
    if (first || convo.messages.length !== lastCount.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: first ? "auto" : "smooth" });
      lastCount.current = convo.messages.length;
    }
  }, [convo.messages.length, tab]);

  useEffect(() => {
    if (tab === "chat") {
      lastCount.current = -1;
      const el = scroller.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [tab]);

  // Auto-grow the composer.
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, [text]);

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
      router.refresh();
    } catch (e) {
      if (e instanceof ApiError && e.code === "confirm_contact") setConfirm(e.message);
      else setError((e as Error).message);
    }
    setSending(false);
  }

  const onPanelChange = async () => {
    await refresh();
    router.refresh();
  };

  const sparkDot = !!convo.spark && !convo.spark.solved;
  const meetDot = convo.datePlan?.status === "proposed" && !convo.datePlan.proposedByMe;
  const TABS: { key: Tab; label: string; icon: typeof MessageCircle; dot?: boolean }[] = [
    { key: "chat", label: "Chat", icon: MessageCircle },
    { key: "spark", label: "Spark", icon: Puzzle, dot: sparkDot },
    { key: "meet", label: "Meet", icon: CalendarHeart, dot: meetDot },
    { key: "profile", label: "Profile", icon: UserRound },
  ];

  // Group messages by day, and mark the last bubble of each run from the same sender.
  const rows: ({ type: "day"; label: string; key: string } | { type: "msg"; m: ChatMessage; tail: boolean; head: boolean })[] = [];
  convo.messages.forEach((m, i) => {
    const prev = convo.messages[i - 1];
    const next = convo.messages[i + 1];
    if (!prev || dayKey(prev.at) !== dayKey(m.at)) rows.push({ type: "day", label: dayLabel(m.at), key: `d${m.id}` });
    const sameAsNext = next && next.from === m.from && dayKey(next.at) === dayKey(m.at) && next.at - m.at < 5 * 60000;
    const sameAsPrev = prev && prev.from === m.from && dayKey(prev.at) === dayKey(m.at) && m.at - prev.at < 5 * 60000;
    rows.push({ type: "msg", m, tail: !sameAsNext, head: !sameAsPrev });
  });

  return (
    <div className="flex h-dvh min-w-0 flex-1 flex-col bg-paper md:h-dvh">
      {/* Header */}
      <div className="glass z-20 shrink-0 border-b border-line/70 px-3 pt-[max(0.6rem,env(safe-area-inset-top))] sm:px-5">
        <div className="flex items-center gap-2.5">
          <Link href="/chats" aria-label="Back to chats" className="rounded-full p-2 text-ink-2 hover:bg-paper-2 md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <button onClick={() => setTab("profile")} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            <Avatar seed={other.avatarSeed} gender={other.gender} name={name} photo={other.photo} size={42} />
            <span className="min-w-0">
              <span className="flex items-center gap-1 font-semibold">
                {name}, {other.age} {other.badges.identity && <VerifiedTick />}
              </span>
              <span className="block truncate text-xs text-muted">
                {active
                  ? convo.expiresInHours <= 48
                    ? `⏳ Closes in ${convo.expiresInHours}h if it stays quiet`
                    : `${other.role}${other.employer ? ` · ${other.employer}` : ""}`
                  : "Conversation closed"}
              </span>
            </span>
          </button>
          <div className="relative">
            <button onClick={() => setMenu((x) => !x)} aria-label="More options" className="rounded-full p-2 text-ink-2 hover:bg-paper-2">
              <MoreVertical className="h-5 w-5" />
            </button>
            {menu && (
              <>
                <button aria-label="Close menu" className="fixed inset-0 z-20 cursor-default" onClick={() => setMenu(false)} />
                <div className="absolute right-0 top-11 z-30 w-60 animate-pop rounded-2xl border border-line bg-card p-1.5 shadow-lift">
                  {active && (
                    <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-paper-2" onClick={() => { setSheet({ kind: "close" }); setMenu(false); }}>
                      <HeartHandshake className="h-4 w-4" /> Close kindly
                    </button>
                  )}
                  <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-rose-2 hover:bg-rose-soft" onClick={() => { setSheet({ kind: "report" }); setMenu(false); }}>
                    <Flag className="h-4 w-4" /> Report {name}
                  </button>
                  <BlockButton userId={other.id} name={name} />
                </div>
              </>
            )}
          </div>
        </div>
        <div className="mt-1.5 flex" role="tablist">
          {TABS.map(({ key, label, icon: Icon, dot }) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`relative flex flex-1 items-center justify-center gap-1.5 px-1 py-2.5 text-[0.82rem] font-semibold transition ${tab === key ? "text-ink" : "text-muted hover:text-ink-2"}`}
            >
              <Icon className={`h-4 w-4 ${tab === key ? "text-rose" : ""}`} /> {label}
              {dot && <span className="bg-love absolute right-[16%] top-2 h-2 w-2 rounded-full" />}
              {tab === key && <span className="bg-love absolute inset-x-4 bottom-0 h-[3px] rounded-full" />}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className={`mx-auto w-full px-3 py-4 sm:px-6 ${tab === "chat" ? "max-w-3xl" : "max-w-4xl"}`}>
          {tab === "chat" && (
            <div>
              {rows.map((r) => {
                if (r.type === "day") {
                  return (
                    <div key={r.key} className="my-4 flex justify-center">
                      <span className="rounded-full bg-paper-2 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-muted">{r.label}</span>
                    </div>
                  );
                }
                const { m, tail, head } = r;
                if (m.from === "system") {
                  return (
                    <div key={m.id} className="mx-auto my-3 max-w-md text-center">
                      <p className={`inline-block rounded-2xl px-3.5 py-2 text-[0.8rem] leading-snug ${m.kind === "spark" ? "bg-gradient-to-br from-rose-soft to-[#fbe9df] text-rose-2" : "bg-card text-ink-2 ring-1 ring-line"}`}>{m.text}</p>
                    </div>
                  );
                }
                const mine = m.from === "me";
                return (
                  <div key={m.id} className={`flex items-end gap-2 ${mine ? "justify-end" : "justify-start"} ${head ? "mt-3" : "mt-0.5"}`}>
                    {!mine && (
                      <div className="w-7 shrink-0">{tail && <Avatar seed={other.avatarSeed} gender={other.gender} name={name} photo={other.photo} size={28} />}</div>
                    )}
                    <div className={`flex max-w-[78%] flex-col ${mine ? "items-end" : "items-start"}`}>
                      <div
                        className={`px-4 py-2.5 text-[0.95rem] leading-relaxed ${
                          mine ? `bg-love text-white ${tail ? "rounded-[1.4rem] rounded-br-md" : "rounded-[1.4rem]"}` : `bg-card text-ink shadow-soft ring-1 ring-line ${tail ? "rounded-[1.4rem] rounded-bl-md" : "rounded-[1.4rem]"}`
                        } ${m.tip ? "ring-2 ring-amber/50" : ""}`}
                      >
                        {m.text}
                      </div>
                      {m.tip && (
                        <div className="mt-1.5 max-w-sm rounded-2xl border border-amber/30 bg-amber-soft px-3 py-2 text-xs text-amber">
                          <p className="flex items-start gap-1.5">
                            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>
                              <strong>Scam Shield:</strong> {m.tip}
                            </span>
                          </p>
                          <button
                            className="mt-1.5 font-bold underline"
                            onClick={() => setSheet({ kind: "report", preset: m.signals?.some((s) => s === "money" || s === "crypto" || s === "upi") ? "scam_or_money" : "other" })}
                          >
                            Report {name}
                          </button>
                        </div>
                      )}
                      {tail && <p className="mt-1 px-1 text-[0.66rem] text-muted">{time(m.at)}</p>}
                    </div>
                  </div>
                );
              })}
              {convo.messages.filter((m) => m.from !== "system").length === 0 && active && (
                <div className="mx-auto mt-8 max-w-sm rounded-[1.75rem] bg-card p-6 text-center shadow-soft ring-1 ring-line">
                  <Avatar seed={other.avatarSeed} gender={other.gender} name={name} photo={other.photo} size={72} ring />
                  <p className="mt-3 font-display text-xl font-semibold">You matched with {name}!</p>
                  <p className="mt-1 text-sm text-ink-2">Skip the &ldquo;hi&rdquo;. Start a two-minute Spark puzzle: you&apos;ll each get half the clues.</p>
                  <button className="btn btn-love btn-sm mt-4" onClick={() => setTab("spark")}>
                    <Puzzle className="h-4 w-4" /> Start a Spark
                  </button>
                </div>
              )}
            </div>
          )}
          {tab === "spark" && <SparkPanel matchId={id} spark={convo.spark} otherName={name} active={active} onChange={onPanelChange} />}
          {tab === "meet" && <MeetPanel convo={convo} venues={venues} onChange={onPanelChange} />}
          {tab === "profile" && <ProfileView card={other} />}
        </div>
      </div>

      {/* Composer */}
      {tab === "chat" && (
        <div className="glass shrink-0 border-t border-line/70 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5">
          <div className="mx-auto max-w-3xl">
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
                <button type="button" aria-label="Open Spark" onClick={() => setTab("spark")} className="round-action mb-0.5 h-11 w-11 shrink-0 bg-card text-rose ring-1 ring-line">
                  <Puzzle className="h-5 w-5" />
                </button>
                <textarea
                  ref={input}
                  rows={1}
                  className="input max-h-36 min-h-[2.9rem] resize-none rounded-[1.5rem] py-3"
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
                <button className="round-action btn-love mb-0.5 h-11 w-11 shrink-0" aria-label="Send" disabled={sending || !text.trim()}>
                  {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizontal className="h-5 w-5" />}
                </button>
              </form>
            ) : (
              <p className="py-1 text-center text-sm text-muted">This conversation is closed.</p>
            )}
          </div>
        </div>
      )}

      {sheet?.kind === "close" && <CloseKindly matchId={id} name={name} templates={templates} onClose={() => setSheet(null)} />}
      {sheet?.kind === "report" && <ReportSheet userId={other.id} matchId={id} name={name} preset={sheet.preset} onClose={() => setSheet(null)} />}
    </div>
  );
}
