"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-semibold">Something went wrong</h1>
      <p className="mt-3 max-w-sm text-ink-2">It&apos;s not you, it&apos;s us. Please try again.</p>
      <button className="btn btn-primary mt-6" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
