import Link from "next/link";

/** Two overlapping rings: two people, one shared space in the middle. */
export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={className}>
      <circle cx="12" cy="16" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.6" />
      <circle cx="20" cy="16" r="8.5" fill="none" stroke="var(--rose)" strokeWidth="2.6" />
      <path d="M16 9.6a8.5 8.5 0 0 1 0 12.8a8.5 8.5 0 0 1 0-12.8z" fill="var(--rose)" opacity="0.18" />
    </svg>
  );
}

export function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2 text-ink ${className}`} aria-label="Pairwise home">
      <LogoMark />
      <span className="font-display text-[1.35rem] font-semibold tracking-tight">pairwise</span>
    </Link>
  );
}
