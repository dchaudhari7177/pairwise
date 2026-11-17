import { Bell, CalendarCheck2, CalendarHeart, CalendarX2, Heart, HeartHandshake, MessageCircleHeart, Puzzle, ShieldCheck, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/Portrait";
import { requireMember } from "@/lib/server/viewer";
import { listActivity, markActivitySeen, type ActivityItem, type ActivityKind } from "@/lib/services/activity";
import { timeAgo } from "@/lib/time";

export const metadata: Metadata = { title: "Activity" };

const ICON: Record<ActivityKind, { icon: typeof Heart; tone: string }> = {
  like: { icon: Heart, tone: "bg-rose-soft text-rose" },
  match: { icon: MessageCircleHeart, tone: "bg-rose-soft text-rose" },
  spark_started: { icon: Puzzle, tone: "bg-amber-soft text-amber" },
  spark_solved: { icon: Trophy, tone: "bg-amber-soft text-amber" },
  date_proposed: { icon: CalendarHeart, tone: "bg-sage-soft text-sage" },
  date_accepted: { icon: CalendarCheck2, tone: "bg-sage-soft text-sage" },
  date_declined: { icon: CalendarX2, tone: "bg-paper-2 text-ink-2" },
  checkin_due: { icon: ShieldCheck, tone: "bg-sage-soft text-sage" },
  closed: { icon: HeartHandshake, tone: "bg-paper-2 text-ink-2" },
};

function Row({ item, fresh }: { item: ActivityItem; fresh: boolean }) {
  const { icon: Icon, tone } = ICON[item.kind];
  return (
    <li>
      <Link
        href={item.href}
        className={`flex items-start gap-3.5 rounded-2xl p-3.5 transition hover:bg-card hover:shadow-soft ${fresh ? "bg-card shadow-soft" : ""}`}
      >
        <span className="relative shrink-0">
          <Avatar seed={item.who.avatarSeed} name={item.who.firstName} gender={item.who.gender} photo={item.who.photo} size={48} />
          <span className={`absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full ring-2 ring-paper ${tone}`}>
            <Icon className="h-3.5 w-3.5" />
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[0.95rem] font-semibold leading-snug">{item.title}</span>
          {item.detail && <span className="mt-0.5 block text-sm text-ink-2">{item.detail}</span>}
          <span className="mt-1 block text-xs text-muted">{timeAgo(item.at)}</span>
        </span>
        {fresh && <span className="bg-love mt-2 h-2.5 w-2.5 shrink-0 rounded-full" aria-label="New" />}
      </Link>
    </li>
  );
}

export default async function ActivityPage() {
  const { store, user } = await requireMember();
  const { items } = await listActivity(store, user);
  const seenBefore = user.activitySeenAt ?? 0;
  const fresh = items.filter((i) => i.at > seenBefore);
  const earlier = items.filter((i) => i.at <= seenBefore);
  if (fresh.length) await markActivitySeen(store, user);

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-6">
        <p className="eyebrow">What happened while you were away</p>
        <h1 className="mt-1 text-[2.1rem] font-semibold leading-tight sm:text-4xl">Activity</h1>
        <p className="mt-2 text-ink-2">Only things you can act on. No &ldquo;someone viewed your profile&rdquo;, no streaks, no guilt.</p>
      </header>

      {items.length === 0 && (
        <div className="card p-8 text-center">
          <Bell className="mx-auto h-10 w-10 text-rose" />
          <p className="mt-3 font-semibold">All quiet for now</p>
          <p className="mt-1 text-sm text-ink-2">Likes, matches, Spark puzzles and date plans will show up here.</p>
          <Link href="/today" className="btn btn-primary mt-5 inline-flex">
            See today&apos;s picks
          </Link>
        </div>
      )}

      {fresh.length > 0 && (
        <section className="mb-6">
          <h2 className="eyebrow mb-2 px-1">New · {fresh.length}</h2>
          <ul className="space-y-1.5">
            {fresh.map((i) => (
              <Row key={i.id} item={i} fresh />
            ))}
          </ul>
        </section>
      )}

      {earlier.length > 0 && (
        <section>
          <h2 className="eyebrow mb-2 px-1">Earlier</h2>
          <ul className="space-y-1">
            {earlier.map((i) => (
              <Row key={i.id} item={i} fresh={false} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
