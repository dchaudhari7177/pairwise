import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2">
            <LogoMark />
            <span className="font-display text-xl font-semibold">pairwise</span>
            <span className="ml-2 rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-paper">Founder console</span>
          </Link>
          <Link href="/" className="text-sm text-ink-2 hover:text-ink">
            View site →
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
