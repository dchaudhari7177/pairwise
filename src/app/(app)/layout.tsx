import { AppMain } from "@/components/AppFrame";
import { AppNav, MobileTopBar } from "@/components/AppNav";
import { requireMember } from "@/lib/server/viewer";
import { listActivity } from "@/lib/services/activity";
import { likesReceived } from "@/lib/services/discovery";
import { listMatches } from "@/lib/services/matches";
import { toCard } from "@/lib/services/profiles";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Waitlisted members may reach Settings and Edit profile (each page decides);
  // every other page redirects them to /waitlist.
  const { store, user } = await requireMember({ allowWaitlisted: true });
  const [likes, matches, activity] = await Promise.all([likesReceived(store, user), listMatches(store, user), listActivity(store, user)]);
  const counts = {
    likes: likes.likes.length,
    unread: matches.active.reduce((n, m) => n + m.unread, 0),
    yourTurn: matches.active.filter((m) => m.yourTurn).length,
    activity: activity.unseen,
  };
  const p = user.profile!;
  const card = toCard(user, { self: true });
  return (
    <div className="flex min-h-dvh">
      <AppNav counts={counts} plus={user.plan === "plus"} me={{ name: p.firstName, seed: p.avatarSeed, gender: p.gender, photo: card.photo }} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar activity={activity.unseen} />
        {user.status === "paused" && (
          <div className="bg-amber-soft px-4 py-2 text-center text-sm text-amber">
            Your profile is paused. Nobody new will see you. <a href="/settings" className="font-semibold underline">Unpause</a>
          </div>
        )}
        {user.status === "waitlisted" && (
          <div className="bg-amber-soft px-4 py-2 text-center text-sm text-amber">
            You&apos;re on the waitlist for your city. <a href="/waitlist" className="font-semibold underline">See your place in line</a>
          </div>
        )}
        <AppMain>{children}</AppMain>
      </div>
    </div>
  );
}
