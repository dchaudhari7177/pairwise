/* eslint-disable @next/next/no-img-element */
import type { Gender } from "@/lib/types";

// Members without a photo (every demo member) get an illustrated portrait
// (see src/lib/avatar.ts) on a soft, per-person background. Uploaded photos
// replace it, and "blur until match" photos arrive already blurred from the server.

const BACKDROPS: [string, string, string][] = [
  ["#ffd9cc", "#f4a99b", "#e9897f"],
  ["#dbe8d4", "#b5d0b0", "#8fb89a"],
  ["#ffe7b8", "#f7c97f", "#eaa75c"],
  ["#e3dcf3", "#c2b5e6", "#9f8fd6"],
  ["#d6e8f3", "#a9cde4", "#7fb0d2"],
  ["#f8d8e2", "#eeb0c4", "#de88a6"],
  ["#d4ece6", "#a3d5c8", "#73bba9"],
  ["#f3e2d3", "#e2c2a4", "#cfa27c"],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function backdropFor(seed: string) {
  return BACKDROPS[hash(seed) % BACKDROPS.length];
}

export function avatarUrl(seed: string, gender?: Gender) {
  return `/avatar/${encodeURIComponent(seed)}?g=${gender ?? "nonbinary"}`;
}

export function Portrait({
  seed,
  name,
  gender,
  photo,
  className = "",
  rounded = "rounded-[1.75rem]",
  showBlurNote = true,
  framing = "card",
}: {
  seed: string;
  name: string;
  gender?: Gender;
  photo?: { url: string; blurred: boolean } | null;
  className?: string;
  rounded?: string;
  showBlurNote?: boolean;
  /** "card": head and shoulders, face in the upper part. "face": tight crop for round avatars. */
  framing?: "card" | "face";
  /** @deprecated kept for older call sites */
  showInitial?: boolean;
}) {
  if (photo) {
    return (
      <div className={`relative overflow-hidden bg-paper-2 ${rounded} ${className}`}>
        <img src={photo.url} alt={photo.blurred ? `${name}'s photo, blurred until you match` : name} className={`h-full w-full object-cover ${photo.blurred ? "scale-110 blur-xl" : ""}`} />
        {photo.blurred && showBlurNote && (
          <span className="absolute inset-x-0 top-1/2 mx-auto w-fit -translate-y-1/2 rounded-full bg-ink/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
            🔒 Unlocks when you match
          </span>
        )}
      </div>
    );
  }
  const [a, b, c] = backdropFor(seed);
  const h = hash(seed);
  return (
    <div
      className={`relative isolate overflow-hidden ${rounded} ${className}`}
      style={{ background: `radial-gradient(120% 90% at ${20 + (h % 60)}% 0%, ${a} 0%, ${b} 55%, ${c} 100%)` }}
    >
      <div className="absolute -right-10 -top-10 h-2/5 w-3/5 rounded-full bg-white/35 blur-2xl" />
      <div className="absolute -bottom-6 -left-8 h-1/3 w-1/2 rounded-full blur-2xl" style={{ background: c, opacity: 0.55 }} />
      <img
        src={avatarUrl(seed, gender)}
        alt={`Illustrated portrait of ${name}`}
        className={`absolute left-1/2 -translate-x-1/2 drop-shadow-[0_12px_18px_rgba(31,26,23,0.18)] ${framing === "face" ? "top-[2%] w-[118%] max-w-none" : "top-[2%] w-[80%]"}`}
        loading="lazy"
        draggable={false}
      />
    </div>
  );
}

export function Avatar({
  seed,
  name,
  gender,
  photo,
  size = 44,
  ring = false,
}: {
  seed: string;
  name: string;
  gender?: Gender;
  photo?: { url: string; blurred: boolean } | null;
  size?: number;
  ring?: boolean;
}) {
  return (
    <div style={{ width: size, height: size }} className={`shrink-0 rounded-full ${ring ? "bg-gradient-to-tr from-[#ff7a59] via-rose to-[#8e2c39] p-[2.5px]" : ""}`}>
      <div className={`h-full w-full rounded-full ${ring ? "bg-paper p-[2px]" : ""}`}>
        <Portrait seed={seed} name={name} gender={gender} photo={photo} rounded="rounded-full" className="h-full w-full" showBlurNote={false} framing="face" />
      </div>
    </div>
  );
}
