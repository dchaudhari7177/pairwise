"use client";

import { Heart, MessageCircle, Settings, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Gender } from "@/lib/types";
import { isConversationPath } from "./AppFrame";
import { LogoMark } from "./Logo";
import { Avatar } from "./Portrait";

const ITEMS = [
  { href: "/today", label: "Discover", icon: Sparkles, key: "today" },
  { href: "/likes", label: "Likes", icon: Heart, key: "likes" },
  { href: "/chats", label: "Chats", icon: MessageCircle, key: "chats" },
  { href: "/me", label: "Profile", icon: UserRound, key: "me" },
] as const;

interface NavProps {
  counts: { likes: number; unread: number; yourTurn: number };
  plus: boolean;
  me: { name: string; seed: string; gender: Gender; photo: { url: string; blurred: boolean } | null };
}

export function AppNav({ counts, plus, me }: NavProps) {
  const path = usePathname();
  const badge = (key: string) => (key === "likes" ? counts.likes : key === "chats" ? counts.unread || counts.yourTurn : 0);
  const active = (href: string) => path === href || path.startsWith(`${href}/`);

  return (
    <>
      {/* Laptop / desktop rail */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-paper/80 px-4 py-6 md:flex">
        <Link href="/today" className="flex items-center gap-2 px-2">
          <LogoMark />
          <span className="font-display text-xl font-semibold">pairwise</span>
        </Link>
        <nav className="mt-9 space-y-1.5">
          {ITEMS.map(({ href, label, icon: Icon, key }) => (
            <Link
              key={href}
              href={href}
              className={`group flex items-center justify-between rounded-2xl px-3.5 py-3 text-[0.95rem] font-semibold transition ${
                active(href) ? "bg-ink text-paper shadow-soft" : "text-ink-2 hover:bg-card hover:shadow-soft"
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${active(href) ? "text-[#ff8f7a]" : "text-muted group-hover:text-rose"}`} strokeWidth={active(href) ? 2.4 : 2} /> {label}
              </span>
              {badge(key) > 0 && <span className="bg-love min-w-6 rounded-full px-2 py-0.5 text-center text-xs font-bold text-white">{badge(key)}</span>}
            </Link>
          ))}
        </nav>
        <div className="mt-6 space-y-1 border-t border-line pt-6 text-sm">
          <Link href="/safety" className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 font-medium ${active("/safety") ? "bg-card text-ink shadow-soft" : "text-ink-2 hover:bg-card"}`}>
            <ShieldCheck className="h-4 w-4 text-sage" /> Safety centre
          </Link>
          <Link href="/settings" className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 font-medium ${active("/settings") ? "bg-card text-ink shadow-soft" : "text-ink-2 hover:bg-card"}`}>
            <Settings className="h-4 w-4 text-muted" /> Settings &amp; privacy
          </Link>
        </div>
        <Link href="/me" className="mt-auto flex items-center gap-3 rounded-2xl border border-line bg-card p-3 shadow-soft transition hover:shadow-lift">
          <Avatar seed={me.seed} name={me.name} gender={me.gender} photo={me.photo} size={42} ring={plus} />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{me.name}</span>
            <span className={`block text-xs ${plus ? "font-semibold text-rose" : "text-muted"}`}>{plus ? "✦ Plus member" : "Free plan · see Plus"}</span>
          </span>
        </Link>
      </aside>

      {/* Mobile bottom bar (hidden inside a conversation) */}
      {!isConversationPath(path) && (
        <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line/70 pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Main">
          <div className="mx-auto grid max-w-md grid-cols-4 px-2">
            {ITEMS.map(({ href, label, icon: Icon, key }) => {
              const on = active(href);
              return (
                <Link key={href} href={href} className="relative flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-bold">
                  <span className={`grid h-8 w-14 place-items-center rounded-full transition ${on ? "bg-rose-soft" : ""}`}>
                    <Icon className={`h-[1.3rem] w-[1.3rem] ${on ? "text-rose" : "text-muted"}`} strokeWidth={on ? 2.5 : 2} fill={on && key !== "today" && key !== "me" ? "currentColor" : "none"} />
                  </span>
                  <span className={on ? "text-ink" : "text-muted"}>{label}</span>
                  {badge(key) > 0 && (
                    <span className="bg-love absolute right-[calc(50%-1.6rem)] top-1.5 min-w-[1.1rem] rounded-full px-1 text-center text-[0.62rem] font-bold leading-[1.1rem] text-white ring-2 ring-paper">
                      {badge(key)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </>
  );
}

const TITLES: [string, string][] = [
  ["/today", "Discover"],
  ["/likes", "Likes"],
  ["/chats", "Chats"],
  ["/me", "Profile"],
  ["/settings", "Settings"],
  ["/safety", "Safety"],
  ["/plus", "Plus"],
];

export function MobileTopBar() {
  const path = usePathname();
  if (isConversationPath(path)) return null;
  const title = TITLES.find(([p]) => path.startsWith(p))?.[1];
  return (
    <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line/60 px-4 md:hidden">
      <Link href="/today" className="flex items-center gap-2" aria-label="Pairwise home">
        <LogoMark size={24} />
        <span className="font-display text-lg font-semibold">{title === "Discover" || !title ? "pairwise" : title}</span>
      </Link>
      <div className="flex items-center gap-0.5">
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
