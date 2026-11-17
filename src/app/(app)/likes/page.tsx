import { Clock, HeartHandshake } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LIMITS } from "@/lib/options";
import { requireMember } from "@/lib/server/viewer";
import { likesReceived } from "@/lib/services/discovery";
import { LikesList } from "./LikesList";

export const metadata: Metadata = { title: "Likes" };

export default async function LikesPage() {
  const { store, user } = await requireMember();
  const { likes, queued } = await likesReceived(store, user);
  const p = user.profile!;
  return (
    <div>
      <header className="mb-6">
        <p className="eyebrow">Free, always</p>
        <h1 className="mt-1 text-4xl font-semibold">Who liked you</h1>
        <p className="mt-2 max-w-xl text-ink-2">
          Other apps charge to see this. We don&apos;t. Sorted by how compatible you are, not by when they arrived.
        </p>
      </header>

      {queued > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-line bg-card p-4 text-sm">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-rose" />
          <p className="text-ink-2">
            <strong className="text-ink">{queued} more {queued === 1 ? "like is" : "likes are"} on the way.</strong> To give everyone a
            fair look, we deliver at most {LIMITS.inboundDailyCap} new likes a day. The rest arrive tomorrow morning, so nobody gets
            lost in a pile.
          </p>
        </div>
      )}

      {likes.length > 0 ? (
        <LikesList likes={likes} me={{ seed: p.avatarSeed, name: p.firstName, values: p.values, interests: p.interests }} />
      ) : (
        <div className="card p-8 text-center">
          <HeartHandshake className="mx-auto h-10 w-10 text-rose" />
          <h2 className="mt-4 text-2xl font-semibold">No new likes yet</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-2">
            Thoughtful prompts get the best responses. Make sure yours give people something to reply to.
          </p>
          <Link href="/me" className="btn btn-ghost mt-6">Polish my profile</Link>
        </div>
      )}
    </div>
  );
}
