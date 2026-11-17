"use client";

import { Download, Loader2, LogOut, PauseCircle, PlayCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client/api";
import type { Privacy } from "@/lib/types";

function Toggle({ checked, onChange, label, hint, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string; disabled?: boolean }) {
  return (
    <label className={`flex items-start justify-between gap-4 py-4 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="mt-0.5 block text-sm text-ink-2">{hint}</span>
      </span>
      <span className="relative mt-1 inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-line-2 transition peer-checked:bg-sage peer-focus-visible:ring-2 peer-focus-visible:ring-rose" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function SettingsPanel({
  privacy: initial,
  paused: initialPaused,
  employer,
  college,
  email,
}: {
  privacy: Privacy;
  paused: boolean;
  employer?: string;
  college?: string;
  email: string;
}) {
  const router = useRouter();
  const [privacy, setPrivacy] = useState(initial);
  const [paused, setPaused] = useState(initialPaused);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function update(patch: Partial<Privacy>) {
    const next = { ...privacy, ...patch };
    setPrivacy(next);
    setSaving(true);
    try {
      await api("/api/settings/privacy", { method: "PATCH", body: patch });
    } catch (e) {
      setPrivacy(privacy);
      setError((e as Error).message);
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <section className="card px-5">
        <p className="eyebrow pt-5">Privacy from your world {saving && <Loader2 className="ml-1 inline h-3 w-3 animate-spin" />}</p>
        <div className="divide-y divide-line">
          <Toggle
            checked={privacy.hideFromCompany}
            onChange={(v) => update({ hideFromCompany: v })}
            disabled={!employer}
            label={`Hide me from people at ${employer ?? "my company"}`}
            hint={employer ? "You won't see them and they won't see you. It works both ways, so nobody can peek." : "Verify your work to use this."}
          />
          <Toggle
            checked={privacy.hideFromCollege}
            onChange={(v) => update({ hideFromCollege: v })}
            disabled={!college}
            label={`Hide me from ${college ?? "my college"} alumni`}
            hint={college ? "Useful if you'd rather not run into batchmates." : "Verify your education to use this."}
          />
          <Toggle
            checked={privacy.blurPhotos}
            onChange={(v) => update({ blurPhotos: v })}
            label="Blur my photos until we match"
            hint="Others only receive a tiny blurred version until you both like each other."
          />
        </div>
      </section>

      <section className="card p-5">
        <p className="eyebrow">Take a break</p>
        <p className="mt-2 text-sm text-ink-2">Pausing hides you from new picks. Your conversations stay open.</p>
        <button
          className="btn btn-ghost mt-4"
          onClick={async () => {
            await api("/api/settings/pause", { body: { paused: !paused } });
            setPaused(!paused);
            router.refresh();
          }}
        >
          {paused ? <PlayCircle className="h-4 w-4" /> : <PauseCircle className="h-4 w-4" />} {paused ? "Unpause my profile" : "Pause my profile"}
        </button>
      </section>

      <section className="card p-5">
        <p className="eyebrow">Your data (DPDP Act rights)</p>
        <p className="mt-2 text-sm text-ink-2">Download everything Pairwise holds about you as a JSON file, any time.</p>
        <a href="/api/account/export" className="btn btn-ghost mt-4">
          <Download className="h-4 w-4" /> Download my data
        </a>
        <div className="mt-6 border-t border-line pt-5">
          <p className="font-semibold text-rose-2">Delete my account</p>
          <p className="mt-1 text-sm text-ink-2">
            This permanently deletes your profile, likes, photos and matches. Your messages in other people&apos;s chats are replaced
            with &ldquo;removed&rdquo;. It can&apos;t be undone.
          </p>
          {!deleting ? (
            <button className="btn btn-quiet mt-3 text-rose-2" onClick={() => setDeleting(true)}>
              <Trash2 className="h-4 w-4" /> Delete account
            </button>
          ) : (
            <div className="mt-3 space-y-2">
              <input className="input" type="password" placeholder={`Password for ${email}`} value={password} onChange={(e) => setPassword(e.target.value)} />
              <div className="flex gap-2">
                <button
                  className="btn btn-rose"
                  disabled={!password}
                  onClick={async () => {
                    setError(null);
                    try {
                      await api("/api/account/delete", { body: { password } });
                      router.push("/?deleted=1");
                      router.refresh();
                    } catch (e) {
                      setError((e as Error).message);
                    }
                  }}
                >
                  Permanently delete
                </button>
                <button className="btn btn-quiet" onClick={() => setDeleting(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-rose-2">{error}</p>}
      </section>

      <button
        className="btn btn-ghost w-full"
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
