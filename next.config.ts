import type { NextConfig } from "next";

// Every screen in Pairwise is per-user (picks, chats, safety state), so the
// static shell Cache Components would give us is tiny. We keep the classic
// request-time rendering model for clarity; see docs/ARCHITECTURE.md.
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  serverExternalPackages: ["firebase-admin"],
  poweredByHeader: false,
};

export default nextConfig;
