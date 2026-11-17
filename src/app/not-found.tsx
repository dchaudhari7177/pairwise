import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="grain flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <Logo />
      <h1 className="mt-10 text-5xl font-semibold">Not a match.</h1>
      <p className="mt-3 max-w-sm text-ink-2">This page doesn&apos;t exist, or it&apos;s no longer available.</p>
      <Link href="/" className="btn btn-primary mt-8">
        Back to Pairwise
      </Link>
    </div>
  );
}
