"use client";

import { Loader2, LogOut, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client/api";

export function ResolveButtons({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  async function act(action: "dismissed" | "warned" | "suspended") {
    setBusy(action);
    await api(`/api/admin/reports/${reportId}`, { body: { action } });
    router.refresh();
    setBusy(null);
  }
  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn btn-ghost btn-sm" disabled={!!busy} onClick={() => act("dismissed")}>
        {busy === "dismissed" && <Loader2 className="h-3 w-3 animate-spin" />} Dismiss
      </button>
      <button className="btn btn-ghost btn-sm" disabled={!!busy} onClick={() => act("warned")}>
        {busy === "warned" && <Loader2 className="h-3 w-3 animate-spin" />} Warn
      </button>
      <button className="btn btn-rose btn-sm" disabled={!!busy} onClick={() => act("suspended")}>
        {busy === "suspended" && <Loader2 className="h-3 w-3 animate-spin" />} Suspend
      </button>
    </div>
  );
}

export function ConsoleActions() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {done && <span className="text-xs text-sage">{done}</span>}
      <button
        className="btn btn-ghost btn-sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const r = await api<{ users: number }>("/api/admin/reset-demo", { body: {} });
          setDone(`Demo reset · ${r.users} accounts restored`);
          setBusy(false);
          router.refresh();
        }}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Reset demo data
      </button>
      <button
        className="btn btn-quiet btn-sm"
        onClick={async () => {
          await api("/api/auth/logout", { body: {} });
          router.push("/");
          router.refresh();
        }}
      >
        <LogOut className="h-4 w-4" /> Log out
      </button>
    </div>
  );
}
