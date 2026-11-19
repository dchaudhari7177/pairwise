import { EyeOff, ListChecks, Timer } from "lucide-react";
import type { Metadata } from "next";
import { cleanSource } from "@/lib/research";
import { ResearchForm } from "./ResearchForm";

export const metadata: Metadata = {
  title: "Two minutes on dating apps",
  description: "An anonymous nine-question survey on what makes dating apps feel safe and worth your time. Your answers shape Pairwise.",
};

export default async function ResearchPage({ searchParams }: { searchParams: Promise<{ src?: string | string[] }> }) {
  const { src } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-12 sm:px-6">
      <p className="eyebrow">Help shape Pairwise</p>
      <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">What would make a dating app worth your time?</h1>
      <p className="mt-4 text-lg text-ink-2">
        We&apos;re building a calmer, verified-only dating app for people in their twenties who moved cities for work. Before betting on
        any feature, we want to hear from you, especially if you&apos;ve given up on the apps you tried.
      </p>
      <ul className="mt-6 grid gap-3 text-sm text-ink-2 sm:grid-cols-3">
        <li className="flex items-center gap-2">
          <Timer className="h-4 w-4 shrink-0 text-rose" /> Nine taps, about 2 minutes
        </li>
        <li className="flex items-center gap-2">
          <EyeOff className="h-4 w-4 shrink-0 text-rose" /> Anonymous: no name, email or login
        </li>
        <li className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 shrink-0 text-rose" /> Each answer tests a real decision
        </li>
      </ul>
      <div className="mt-8">
        <ResearchForm src={cleanSource(Array.isArray(src) ? src[0] : src)} />
      </div>
    </div>
  );
}
