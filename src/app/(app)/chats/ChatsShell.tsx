"use client";

import { CalendarHeart, MessagesSquare, Puzzle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isConversationPath } from "@/components/AppFrame";
import { Avatar } from "@/components/Portrait";
import type { MatchSummary } from "@/lib/services/matches";
import { timeAgo } from "@/lib/time";

interface ListData {
  active: MatchSummary[];
  closed: MatchSummary[];
  slots: { used: number; limit: number };
}

function Row({ m, selected }: { m: MatchSummary; selected: boolean }) {
  return (
    <Link
      href={`/chats/${m.id}`}
      className={`flex items-center gap-3.5 rounded-2xl px-3 py-3 transition ${selected ? "bg-card shadow-soft ring-1 ring-line" : "hover:bg-card/70"}`}
    >
      <div className="relative">
        <Avatar seed={m.other.avatarSeed} gender={m.other.gender} name={m.other.firstName} photo={m.other.photo} size={54} />
        {m.unread > 0 && <span className="bg-love absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full ring-[3px] ring-paper" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`truncate font-semibold ${m.status !== "active" ? "text-muted" : ""}`}>{m.other.firstName}</p>
          {m.lastMessageAt && <span className={`shrink-0 text-xs ${m.unread ? "font-bold text-rose" : "text-muted"}`}>{timeAgo(m.lastMessageAt)}</span>}
        </div>
        <p className={`truncate text-sm ${m.unread ? "font-semibold text-ink" : "text-ink-2"}`}>{m.preview ?? "Say hello, or start a Spark"}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {m.status === "active" && m.yourTurn && (
            <span className={`rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${m.nudge ? "bg-amber-soft text-amber" : "bg-rose-soft text-rose-2"}`}>
              Your turn{m.nudge ? ` · ${m.waitingHours}h` : ""}
            </span>
          )}
          {m.hasSpark && (
            <span className="inline-flex items-center gap-1 rounded-full bg-paper-2 px-2 py-0.5 text-[0.68rem] font-semibold text-ink-2">
              <Puzzle className="h-3 w-3" /> {m.sparkSolved ? "Solved" : "Spark"}
            </span>
          )}
          {m.datePlanned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2 py-0.5 text-[0.68rem] font-bold text-sage">
              <CalendarHeart className="h-3 w-3" /> Date
            </span>
          )}
          {m.status === "active" && m.expiresInHours <= 48 && <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[0.68rem] text-muted">Closes in {m.expiresInHours}h</span>}
          {m.status !== "active" && (
            <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[0.68rem] text-muted">
              {m.closeReason === "expired" ? "Expired" : m.closeReason === "kindly" ? (m.closedByMe ? "You closed kindly" : "Closed kindly") : "Closed"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ChatList({ data }: { data: ListData }) {
  const path = usePathname();
  const fresh = data.active.filter((m) => m.fresh);
  const ongoing = data.active.filter((m) => !m.fresh);
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-3 pt-5 sm:px-5">
        <h1 className="text-[2rem] font-semibold leading-tight">Chats</h1>
        <div className="mt-3 rounded-2xl border border-line bg-card p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-muted">Open slots</span>
            <span className="font-semibold text-ink-2">
              {data.slots.used} of {data.slots.limit}
            </span>
          </div>
          <div className="mt-2 flex gap-1.5">
            {Array.from({ length: data.slots.limit }, (_, i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i < data.slots.used ? "bg-love" : "bg-line"}`} />
            ))}
          </div>
          <p className="mt-2 text-[0.72rem] leading-snug text-muted">Fewer chats, more attention. Close one kindly to open a slot; quiet chats close after 7 days.</p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-28 sm:px-3 md:pb-6">
        {fresh.length > 0 && (
          <section className="mb-2">
            <p className="eyebrow px-3 pb-2">New matches</p>
            <div className="no-scrollbar flex gap-4 overflow-x-auto px-3 pb-2">
              {fresh.map((m) => (
                <Link key={m.id} href={`/chats/${m.id}`} className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5">
                  <Avatar seed={m.other.avatarSeed} gender={m.other.gender} name={m.other.firstName} photo={m.other.photo} size={68} ring />
                  <span className="w-full truncate text-center text-xs font-semibold">{m.other.firstName}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {data.active.length === 0 && data.closed.length === 0 ? (
          <div className="mx-3 mt-6 rounded-[1.5rem] border border-dashed border-line-2 p-8 text-center">
            <MessagesSquare className="mx-auto h-9 w-9 text-rose" />
            <p className="mt-3 font-semibold">No conversations yet</p>
            <p className="mt-1 text-sm text-ink-2">When a like is mutual, the chat opens here, with a Spark ready to break the ice.</p>
            <Link href="/today" className="btn btn-primary btn-sm mt-4">
              See today&apos;s picks
            </Link>
          </div>
        ) : (
          <>
            {ongoing.length > 0 && <p className="eyebrow px-3 pb-1 pt-2">Messages</p>}
            <div className="space-y-0.5">
              {ongoing.map((m) => (
                <Row key={m.id} m={m} selected={path === `/chats/${m.id}`} />
              ))}
            </div>
            {data.closed.length > 0 && (
              <section className="mt-5">
                <p className="eyebrow px-3 pb-1">Closed</p>
                <div className="space-y-0.5 opacity-75">
                  {data.closed.map((m) => (
                    <Row key={m.id} m={m} selected={path === `/chats/${m.id}`} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Mobile: list OR conversation. Laptop: list AND conversation side by side. */
export function ChatsShell({ data, children }: { data: ListData; children: React.ReactNode }) {
  const path = usePathname();
  const inConvo = isConversationPath(path);
  return (
    <div className="flex min-h-0 flex-1 md:h-dvh">
      <div className={`w-full border-line md:block md:w-[22rem] md:shrink-0 md:border-r lg:w-[24rem] ${inConvo ? "hidden" : "block"}`}>
        <ChatList data={data} />
      </div>
      <div className={`min-w-0 flex-1 ${inConvo ? "flex" : "hidden md:flex"}`}>{children}</div>
    </div>
  );
}
