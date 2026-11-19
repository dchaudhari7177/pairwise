"use client";

import { Check, ChevronDown, Compass, ExternalLink, Loader2, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { isConversationPath } from "@/components/AppFrame";
import { api } from "@/lib/client/api";
import { DEMO_PASSWORD, GUIDE_EXTRAS, GUIDE_ORDER, GUIDES, type DemoAccountId, type GuideStep } from "@/lib/demo-guide";

// Progress is a per-viewer convenience, so browser storage is fine. Every
// access is guarded: private windows and blocked storage must not break the page
// (progress then lasts only until the next full page load).
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function readRaw(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? memory.get(key) ?? "";
  } catch {
    return memory.get(key) ?? "";
  }
}
function writeJson(key: string, value: unknown) {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    // Storage unavailable: the in-memory copy still drives the UI.
  }
  listeners.forEach((l) => l());
}
function parse<T>(raw: string, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}
/** The raw stored value on the client; null during server render and hydration. */
function useStored(key: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );
}

/**
 * The evaluator walkthrough, inside the app. Shown only to demo accounts:
 * a short checklist of the screens that carry the product's ideas, with deep
 * links, plus one-click switching between stories and a demo reset.
 */
export function DemoGuide({
  account,
  dock = "corner",
  serverDone = [],
}: {
  account: DemoAccountId;
  dock?: "sidebar" | "corner";
  /** Steps the server knows are done (for example Vivek has left the waitlist). */
  serverDone?: string[];
}) {
  const guide = GUIDES[account];
  const path = usePathname();
  const router = useRouter();
  const doneKey = `pw-guide-done:${account}`;
  const openKey = `pw-guide-open:${account}`;

  const doneRaw = useStored(doneKey);
  const openRaw = useStored(openKey);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  // A conversation needs the whole screen, so the guide minimises itself there
  // unless it was reopened on that very conversation.
  const [peekPath, setPeekPath] = useState<string | null>(null);

  const ready = doneRaw !== null && openRaw !== null;
  const done = Array.from(new Set([...parse<string[]>(doneRaw ?? "", []), ...serverDone]));
  // Open by default the first time an account is used.
  const open = parse<boolean>(openRaw ?? "", true);

  // Visiting a step's screen ticks it off (written to the store, not React state).
  useEffect(() => {
    if (!ready) return;
    const saved = parse<string[]>(readRaw(doneKey), []);
    const hit = guide.steps.filter((s) => s.visit?.test(path) && !saved.includes(s.id)).map((s) => s.id);
    if (hit.length > 0) writeJson(doneKey, [...saved, ...hit]);
  }, [path, ready, guide, doneKey]);

  function toggleOpen(value: boolean) {
    setPeekPath(value ? path : null);
    writeJson(openKey, value);
  }

  // On a phone the open guide covers most of the screen: get out of the way once a step is chosen.
  function followStep(step: GuideStep) {
    // Steps with no screen of their own (a section of the console) count as seen once followed.
    if (!step.visit && !done.includes(step.id)) writeJson(doneKey, [...parse<string[]>(readRaw(doneKey), []), step.id]);
    try {
      if (window.matchMedia("(max-width: 767px)").matches) writeJson(openKey, false);
    } catch {
      // matchMedia unavailable: leave the guide as it is.
    }
  }

  function toggleStep(id: string) {
    writeJson(doneKey, done.includes(id) ? done.filter((x) => x !== id) : [...done, id]);
  }

  async function switchTo(id: DemoAccountId) {
    setBusy(id);
    setNote(null);
    try {
      const { next } = await api<{ next: string }>("/api/auth/login", { body: { email: `${id}@pairwise.demo`, password: DEMO_PASSWORD } });
      writeJson(`pw-guide-open:${id}`, true);
      router.push(next);
      router.refresh();
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function reset() {
    if (!window.confirm("Restore every demo story to its starting point? This takes about 10 seconds and resets the demo for everyone.")) return;
    setBusy("reset");
    setNote(null);
    try {
      await api("/api/demo/reset", { body: {} });
      for (const id of GUIDE_ORDER) writeJson(`pw-guide-done:${id}`, []);
      setNote("Demo restored. Every story is back at its start.");
      router.refresh();
    } catch (e) {
      setNote((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (!ready) return null;
  const count = guide.steps.filter((s) => done.includes(s.id)).length;
  const total = guide.steps.length;
  // Only the next step explains itself, which keeps the panel short enough not to hide the screen.
  const current = guide.steps.find((s) => !done.includes(s.id))?.id;
  const nextStory = GUIDE_ORDER[(GUIDE_ORDER.indexOf(account) + 1) % GUIDE_ORDER.length];
  // Inside a conversation on a phone the composer owns the bottom edge.
  const inConversation = isConversationPath(path);
  const hideOnPhone = inConversation;
  const showPanel = open && (!inConversation || peekPath === path);
  // In the app the minimised pill sits in the sidebar's empty space on laptops, clear of every screen.
  const pillPlace = dock === "sidebar" ? "md:bottom-28 md:left-5 md:right-auto" : "md:bottom-6 md:right-6";

  if (!showPanel) {
    return (
      <button
        type="button"
        onClick={() => toggleOpen(true)}
        className={`fixed bottom-24 right-4 z-50 items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-paper shadow-lift transition hover:-translate-y-0.5 ${pillPlace} ${hideOnPhone ? "hidden md:inline-flex" : "inline-flex"}`}
        aria-label={`Open the evaluator guide, ${count} of ${total} done`}
      >
        <Compass className="h-4 w-4" /> Evaluator guide
        <span className="rounded-full bg-paper/15 px-2 py-0.5 text-xs tabular-nums">
          {count}/{total}
        </span>
      </button>
    );
  }

  return (
    <aside
      aria-label="Evaluator guide"
      className={`fixed inset-x-3 bottom-20 z-50 max-h-[70dvh] flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-lift md:inset-x-auto md:bottom-6 md:right-6 md:w-[22rem] md:max-h-[min(34rem,calc(100dvh-3rem))] ${hideOnPhone ? "hidden md:flex" : "flex"}`}
    >
      <header className="flex items-start justify-between gap-3 bg-ink px-5 py-4 text-paper">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper/60">Evaluator guide · {guide.name}</p>
          <p className="mt-1 text-sm leading-snug">{guide.theme}</p>
          <div className="mt-2.5 h-1.5 w-40 overflow-hidden rounded-full bg-paper/15" role="img" aria-label={`${count} of ${total} done`}>
            <div className="h-full rounded-full bg-rose transition-all" style={{ width: `${(count / total) * 100}%` }} />
          </div>
        </div>
        <button type="button" onClick={() => toggleOpen(false)} className="rounded-full p-1 text-paper/70 hover:bg-paper/10 hover:text-paper" aria-label="Minimise the guide">
          <ChevronDown className="h-5 w-5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <ol className="divide-y divide-line">
          {guide.steps.map((s, i) => {
            const isDone = done.includes(s.id);
            return (
              <li key={s.id} aria-current={s.id === current ? "step" : undefined} className={`flex gap-3 px-5 ${s.id === current ? "bg-rose-soft/40 py-3.5" : "py-2.5"}`} title={s.id === current ? undefined : s.detail}>
                <button
                  type="button"
                  onClick={() => toggleStep(s.id)}
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition ${isDone ? "border-sage bg-sage text-white" : "border-line text-muted hover:border-ink"}`}
                  aria-label={isDone ? `Mark step ${i + 1} as not done` : `Mark step ${i + 1} as done`}
                  aria-pressed={isDone}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </button>
                <div className="min-w-0">
                  <Link href={s.href} onClick={() => followStep(s)} className={`font-semibold leading-snug hover:text-rose ${isDone ? "text-ink-2" : ""}`}>
                    {s.title} <span aria-hidden className="text-rose">→</span>
                  </Link>
                  {s.id === current && <p className="mt-0.5 text-[0.82rem] leading-snug text-ink-2">{s.detail}</p>}
                </div>
              </li>
            );
          })}
        </ol>

        {count === total && (
          <div className="border-t border-line bg-sage-soft/60 px-5 py-3.5 text-sm">
            <p className="font-semibold">That&apos;s {guide.name}&apos;s story.</p>
            <button
              type="button"
              onClick={() => switchTo(nextStory)}
              disabled={!!busy}
              className="mt-1 inline-flex items-center gap-1 font-semibold text-rose hover:underline disabled:opacity-50"
            >
              {busy === nextStory && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Next: {GUIDES[nextStory].name}, {GUIDES[nextStory].theme.charAt(0).toLowerCase() + GUIDES[nextStory].theme.slice(1)} →
            </button>
          </div>
        )}

        <div className="border-t border-line px-5 py-4">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">Switch story</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {GUIDE_ORDER.filter((id) => id !== account).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => switchTo(id)}
                disabled={!!busy}
                className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-2 transition hover:border-ink hover:text-ink disabled:opacity-50"
              >
                {busy === id && <Loader2 className="h-3 w-3 animate-spin" />}
                {GUIDES[id].name}
              </button>
            ))}
          </div>

          <p className="mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted">Beyond the app</p>
          <ul className="mt-1.5 space-y-1">
            {GUIDE_EXTRAS.map((x) => (
              <li key={x.href}>
                <Link href={x.href} className="inline-flex items-center gap-1 text-[0.82rem] text-ink-2 hover:text-rose">
                  {x.label} <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={reset}
              disabled={!!busy}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink disabled:opacity-50"
            >
              {busy === "reset" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
              Someone got here first? Restore the demo
            </button>
            <button type="button" onClick={() => toggleOpen(false)} className="text-xs text-muted hover:text-ink" aria-label="Close the guide">
              <X className="h-4 w-4" />
            </button>
          </div>
          {note && <p className="mt-2 text-xs text-ink-2" role="status">{note}</p>}
        </div>
      </div>
    </aside>
  );
}
