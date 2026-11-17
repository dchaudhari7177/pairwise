"use client";

import { Heart, MessageCircle, Settings, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "./Logo";

const ITEMS = [
  { href: "/today", label: "Today", icon: Sparkles, key: "today" },
  { href: "/likes", label: "Likes", icon: Heart, key: "likes" },
  { href: "/chats", label: "Chats", icon: MessageCircle, key: "chats" },
  { href: "/me", label: "Me", icon: UserRound, key: "me" },
] as const;

export function AppNav({ counts, plus, name }: { counts: { likes: number; unread: number; yourTurn: number }; plus: boolean; name: string }) {
  const path = usePathname();
  const badge = (key: string) => (key === "likes" ? counts.likes : key === "chats" ? counts.unread || counts.yourTurn : 0);
  const active = (href: string) => path === href || path.startsWith(`${href}/`);

  return (
    <>
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-paper px-4 py-6 md:flex">
        <Link href="/today" className="flex items-center gap-2 px-2">
          <LogoMark />
          <span className="font-display text-xl font-semibold">pairwise</span>
        </Link>
        <nav className="mt-8 space-y-1">
          {ITEMS.map(({ href, label, icon: Icon, key }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center justify-between rounded-2xl px-3 py-2.5 text-[0.95rem] font-medium transition ${active(href) ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-2"}`}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-5 w-5" /> {label}
              </span>
              {badge(key) > 0 && <span className={`rounded-full px-2 text-xs font-semibold ${active(href) ? "bg-paper text-ink" : "bg-rose text-white"}`}>{badge(key)}</span>}
            </Link>
          ))}
        </nav>
        <div className="mt-6 space-y-1 border-t border-line pt-6 text-sm">
          <Link href="/safety" className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${active("/safety") ? "bg-paper-2 text-ink" : "text-ink-2 hover:bg-paper-2"}`}>
            <ShieldCheck className="h-4 w-4" /> Safety centre
          </Link>
          <Link href="/settings" className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${active("/settings") ? "bg-paper-2 text-ink" : "text-ink-2 hover:bg-paper-2"}`}>
            <Settings className="h-4 w-4" /> Settings &amp; privacy
          </Link>
        </div>
        <div className="mt-auto rounded-2xl border border-line bg-card p-4 text-sm">
          <p className="font-semibold">Hi, {name}</p>
          {plus ? (
            <p className="mt-1 text-ink-2">You&apos;re on Plus ✦</p>
          ) : (
            <Link href="/plus" className="mt-1 inline-block text-rose hover:underline">
              Explore Plus →
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {ITEMS.map(({ href, label, icon: Icon, key }) => (
            <Link key={href} href={href} className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[0.7rem] font-semibold ${active(href) ? "text-ink" : "text-muted"}`}>
              <Icon className={`h-[1.35rem] w-[1.35rem] ${active(href) ? "text-rose" : ""}`} strokeWidth={active(href) ? 2.4 : 2} />
              {label}
              {badge(key) > 0 && <span className="absolute right-[calc(50%-1.4rem)] top-1.5 min-w-4 rounded-full bg-rose px-1 text-center text-[0.6rem] leading-4 text-white">{badge(key)}</span>}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line/70 bg-paper/90 px-4 backdrop-blur md:hidden">
      <Link href="/today" className="flex items-center gap-2">
        <LogoMark size={24} />
        <span className="font-display text-lg font-semibold">pairwise</span>
      </Link>
      <div className="flex items-center gap-1">
        <Link href="/safety" aria-label="Safety centre" className="rounded-full p-2 text-ink-2 hover:bg-paper-2">
          <ShieldCheck className="h-5 w-5" />
        </Link>
        <Link href="/settings" aria-label="Settings" className="rounded-full p-2 text-ink-2 hover:bg-paper-2">
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
