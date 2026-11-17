import { AppNav, MobileTopBar } from "@/components/AppNav";
import { requireMember } from "@/lib/server/viewer";
import { likesReceived } from "@/lib/services/discovery";
import { listMatches } from "@/lib/services/matches";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { store, user } = await requireMember();
  const [likes, matches] = await Promise.all([likesReceived(store, user), listMatches(store, user)]);
  const counts = {
    likes: likes.likes.length,
    unread: matches.active.reduce((n, m) => n + m.unread, 0),
    yourTurn: matches.active.filter((m) => m.yourTurn).length,
  };
  return (
    <div className="flex min-h-dvh">
      <AppNav counts={counts} plus={user.plan === "plus"} name={user.profile!.firstName} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        {user.status === "paused" && (
          <div className="bg-amber-soft px-4 py-2 text-center text-sm text-amber">
            Your profile is paused. Nobody new will see you. <a href="/settings" className="font-semibold underline">Unpause</a>
          </div>
        )}
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-10">{children}</main>
      </div>
    </div>
  );
}
