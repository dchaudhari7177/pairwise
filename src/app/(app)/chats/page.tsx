import { CalendarHeart, MessagesSquare, Puzzle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/Portrait";
import { requireMember } from "@/lib/server/viewer";
import { listMatches, type MatchSummary } from "@/lib/services/matches";
import { timeAgo } from "@/lib/time";

export const metadata: Metadata = { title: "Chats" };

function Row({ m }: { m: MatchSummary }) {
  return (
    <Link href={`/chats/${m.id}`} className="flex items-center gap-4 rounded-2xl p-3 transition hover:bg-card">
      <div className="relative">
        <Avatar seed={m.other.avatarSeed} name={m.other.firstName} photo={m.other.photo} size={56} />
        {m.unread > 0 && <span className="absolute -right-0.5 -top-0.5 h-4 w-4 rounded-full border-2 border-paper bg-rose" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`truncate font-semibold ${m.status !== "active" ? "text-muted" : ""}`}>{m.other.firstName}</p>
          {m.lastMessageAt && <span className="shrink-0 text-xs text-muted">{timeAgo(m.lastMessageAt)}</span>}
        </div>
        <p className={`truncate text-sm ${m.unread ? "font-semibold text-ink" : "text-ink-2"}`}>{m.preview ?? "Say hello, or start a Spark"}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {m.status === "active" && m.yourTurn && (
            <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${m.nudge ? "bg-amber-soft text-amber" : "bg-rose-soft text-rose-2"}`}>
              Your turn{m.nudge ? ` · waiting ${m.waitingHours}h` : ""}
            </span>
          )}
          {m.hasSpark && (
            <span className="inline-flex items-center gap-1 rounded-full bg-paper-2 px-2 py-0.5 text-[0.7rem] font-medium text-ink-2">
              <Puzzle className="h-3 w-3" /> {m.sparkSolved ? "Spark solved" : "Spark in progress"}
            </span>
          )}
          {m.datePlanned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sage-soft px-2 py-0.5 text-[0.7rem] font-semibold text-sage">
              <CalendarHeart className="h-3 w-3" /> Date planned
            </span>
          )}
          {m.status === "active" && m.expiresInHours <= 48 && (
            <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[0.7rem] text-muted">Closes in {m.expiresInHours}h if quiet</span>
          )}
          {m.status !== "active" && (
            <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[0.7rem] text-muted">
              {m.closeReason === "expired" ? "Expired" : m.closeReason === "kindly" ? (m.closedByMe ? "You closed kindly" : "Closed kindly") : "Closed"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function ChatsPage() {
  const { store, user } = await requireMember();
  const { active, closed, slots } = await listMatches(store, user);
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-4xl font-semibold">Conversations</h1>
        <div className="mt-4 rounded-2xl border border-line bg-card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Open slots</span>
            <span className="text-ink-2">
              {slots.used} of {slots.limit} in use
            </span>
          </div>
          <div className="mt-2 flex gap-1.5">
            {Array.from({ length: slots.limit }, (_, i) => (
              <span key={i} className={`h-2 flex-1 rounded-full ${i < slots.used ? "bg-rose" : "bg-line"}`} />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            Fewer conversations, more attention. Close one kindly to open a slot. Chats that go quiet for 7 days close on their own.
          </p>
        </div>
      </header>

      {active.length === 0 && closed.length === 0 ? (
        <div className="card p-8 text-center">
          <MessagesSquare className="mx-auto h-10 w-10 text-rose" />
          <h2 className="mt-4 text-2xl font-semibold">No conversations yet</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-2">When a like is mutual, the conversation opens here, with a Spark puzzle ready to break the ice.</p>
          <Link href="/today" className="btn btn-primary mt-6">See today&apos;s picks</Link>
        </div>
      ) : (
        <>
          <section className="space-y-1">{active.map((m) => <Row key={m.id} m={m} />)}</section>
          {closed.length > 0 && (
            <section className="mt-8">
              <p className="eyebrow mb-2 px-3">Closed</p>
              <div className="space-y-1 opacity-80">{closed.map((m) => <Row key={m.id} m={m} />)}</div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
