import { avatarSvg } from "@/lib/avatar";
import type { Gender } from "@/lib/types";

const GENDERS = new Set<Gender>(["woman", "man", "nonbinary"]);

// Deterministic SVG portraits, cached hard by the browser and the CDN.
export async function GET(req: Request, { params }: { params: Promise<{ seed: string }> }) {
  const { seed } = await params;
  const g = new URL(req.url).searchParams.get("g") as Gender | null;
  const svg = avatarSvg(seed.slice(0, 64), g && GENDERS.has(g) ? g : "nonbinary");
  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
