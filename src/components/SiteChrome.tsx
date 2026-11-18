import Link from "next/link";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-2 md:flex">
          <Link href="/#how" className="hover:text-ink">How it works</Link>
          <Link href="/#safety" className="hover:text-ink">Safety</Link>
          <Link href="/#pricing" className="hover:text-ink">Pricing</Link>
          <Link href="/partners" className="hover:text-ink">For venues</Link>
          <Link href="/why" className="hover:text-ink">Founder&apos;s notes</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn btn-quiet btn-sm">Log in</Link>
          <Link href="/join" className="btn btn-primary btn-sm">Join</Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-paper-2/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-ink-2">
            Verified, slow dating for India&apos;s early-career professionals. A product concept built end to end for the
            eLitmus Software Developer assignment by Dipak Chaudhari.
          </p>
          <p className="mt-3 text-xs text-muted">All demo members, colleges and employers are fictional.</p>
        </div>
        <div className="text-sm">
          <p className="eyebrow mb-3">Product</p>
          <ul className="space-y-2 text-ink-2">
            <li><Link href="/why" className="hover:text-ink">Founder&apos;s notes</Link></li>
            <li><Link href="/#demo" className="hover:text-ink">Try the demo</Link></li>
            <li><Link href="/join" className="hover:text-ink">Join</Link></li>
            <li><Link href="/partners" className="hover:text-ink">For venues</Link></li>
            <li><Link href="/partners/redeem" className="hover:text-ink">Partner counter</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="eyebrow mb-3">Trust</p>
          <ul className="space-y-2 text-ink-2">
            <li><Link href="/legal/privacy" className="hover:text-ink">Privacy notice</Link></li>
            <li><Link href="/legal/terms" className="hover:text-ink">Terms of use</Link></li>
            <li><Link href="/legal/guidelines" className="hover:text-ink">Community guidelines</Link></li>
            <li><Link href="/legal/grievance" className="hover:text-ink">Grievance officer</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
