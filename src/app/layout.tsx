import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Pairwise: fewer matches, real people",
    template: "%s · Pairwise",
  },
  description:
    "A verified-only, slow-dating app for India's early-career professionals. Daily picks, real people, and conversations that start themselves.",
  applicationName: "Pairwise",
  appleWebApp: { capable: true, title: "Pairwise", statusBarStyle: "default" },
  openGraph: {
    title: "Pairwise: fewer matches, real people",
    description: "Verified-only, slow dating for early-career India.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf6f0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Font variables sit on <html> so the @theme font tokens resolve everywhere.
    <html lang="en-IN" className={`${fraunces.variable} ${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
