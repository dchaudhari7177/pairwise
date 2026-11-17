"use client";

import { usePathname } from "next/navigation";

export const isConversationPath = (path: string) => /^\/chats\/[^/]+/.test(path);

/**
 * Chooses the page frame by route. Chats get a full-height, edge-to-edge
 * frame (a split view on laptops). Profile-heavy screens get a wider
 * column. Everything else gets a comfortable reading width.
 */
export function AppMain({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (path.startsWith("/chats")) return <main className="flex min-h-0 w-full flex-1 flex-col">{children}</main>;
  const wide = path.startsWith("/today") || path.startsWith("/likes") || path.startsWith("/me");
  return (
    <main className={`mx-auto w-full flex-1 px-4 pb-28 pt-5 sm:px-6 md:pb-12 md:pt-10 ${wide ? "max-w-5xl" : "max-w-3xl"}`}>{children}</main>
  );
}

/** Hides mobile chrome (top bar, bottom nav) inside a conversation, like a messaging app. */
export function MobileChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  if (isConversationPath(path)) return null;
  return <>{children}</>;
}
