/* eslint-disable @next/next/no-img-element */

// Demo members don't have real photos. Using real faces for fictional people
// would be dishonest, so each gets a generated, editorial-style portrait.
// Real members can upload a photo, which is shown here instead.

const PALETTES: [string, string, string][] = [
  ["#f1c9b6", "#b23a48", "#7d2533"],
  ["#cfdcc8", "#2f6b4f", "#1f4a36"],
  ["#f3dcae", "#b07a24", "#7a5114"],
  ["#d3cde6", "#4b3266", "#2c1a30"],
  ["#c7dbe8", "#2c5f7c", "#1b3d52"],
  ["#eccbd2", "#9b3a52", "#6b2236"],
  ["#dfd1bf", "#7a5a40", "#4f3826"],
  ["#c9e0dc", "#2e6d68", "#1d4744"],
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function Portrait({
  seed,
  name,
  photo,
  className = "",
  rounded = "rounded-3xl",
  showInitial = true,
}: {
  seed: string;
  name: string;
  photo?: { url: string; blurred: boolean } | null;
  className?: string;
  rounded?: string;
  showInitial?: boolean;
}) {
  if (photo) {
    return (
      <div className={`relative overflow-hidden bg-paper-2 ${rounded} ${className}`}>
        <img src={photo.url} alt={photo.blurred ? `${name}'s photo (blurred until you match)` : `${name}`} className={`h-full w-full object-cover ${photo.blurred ? "scale-110 blur-xl" : ""}`} />
        {photo.blurred && (
          <span className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-paper backdrop-blur">
            Photo unlocks when you match
          </span>
        )}
      </div>
    );
  }
  const h = hash(seed);
  const [bg, mid, deep] = PALETTES[h % PALETTES.length];
  const tilt = (h % 7) - 3;
  const sunX = 60 + (h % 180);
  const id = `p${h.toString(36)}`;
  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`} style={{ background: bg }}>
      <svg viewBox="0 0 300 375" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={bg} />
            <stop offset="1" stopColor={mid} stopOpacity="0.55" />
          </linearGradient>
          <radialGradient id={`${id}s`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="300" height="375" fill={`url(#${id}g)`} />
        <circle cx={sunX} cy="96" r="70" fill={`url(#${id}s)`} />
        <g transform={`rotate(${tilt} 150 300)`} fill={deep} opacity="0.9">
          <circle cx="150" cy="168" r="54" />
          <path d="M40 375c4-86 50-128 110-128s106 42 110 128z" />
        </g>
        <g fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="1.2">
          <circle cx="150" cy="168" r="66" />
          <circle cx="150" cy="168" r="80" />
        </g>
      </svg>
      {showInitial && (
        <span className="absolute bottom-3 left-4 font-display text-4xl font-semibold text-white/90 drop-shadow-sm">
          {name.slice(0, 1)}
        </span>
      )}
    </div>
  );
}

export function Avatar({ seed, name, photo, size = 44 }: { seed: string; name: string; photo?: { url: string; blurred: boolean } | null; size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="shrink-0">
      <Portrait seed={seed} name={name} photo={photo ? { ...photo, blurred: photo.blurred } : null} rounded="rounded-full" className="h-full w-full" showInitial={false} />
    </div>
  );
}
