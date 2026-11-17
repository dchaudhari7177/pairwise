import type { MetadataRoute } from "next";

// Installable PWA: one codebase for web and phone, and no app-store commission on Plus.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pairwise",
    short_name: "Pairwise",
    description: "Verified, slow dating for India's early-career professionals.",
    start_url: "/today",
    display: "standalone",
    background_color: "#faf6f0",
    theme_color: "#faf6f0",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
