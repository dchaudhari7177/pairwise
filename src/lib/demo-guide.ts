// The evaluator walkthrough (docs/DEMO.md), brought into the app itself.
// Shortlisting happens in the live app, not on GitHub, so each demo account
// carries its own short checklist of the screens worth seeing, with deep links.

/** Password for every demo account (they are public by design). */
export const DEMO_PASSWORD = "Demo@2026";

export type DemoAccountId = "aarav" | "meera" | "kabir" | "vivek" | "admin";

export interface GuideStep {
  /** Stable key for remembering progress. */
  id: string;
  title: string;
  /** What to look for, and why it's there. One or two sentences. */
  detail: string;
  href: string;
  /** Visiting a path that matches ticks the step off. Omit for manual-only steps. */
  visit?: RegExp;
}

export interface Guide {
  id: DemoAccountId;
  name: string;
  /** One line: what this account demonstrates. */
  theme: string;
  steps: GuideStep[];
}

export const GUIDES: Record<DemoAccountId, Guide> = {
  aarav: {
    id: "aarav",
    name: "Aarav",
    theme: "The core loop: picks, a shared puzzle, a safe first date",
    steps: [
      {
        id: "today",
        title: "Five picks, each with a reason",
        detail: "No endless feed. Open “Why you're seeing…” on a pick, then like one specific answer with a note.",
        href: "/today",
        visit: /^\/today/,
      },
      {
        id: "likes",
        title: "See who liked you, free",
        detail: "The most common paywall in dating is free here. Diya liked a prompt and left a note. Like back to match.",
        href: "/likes",
        visit: /^\/likes/,
      },
      {
        id: "spark",
        title: "Solve a Spark with Sneha",
        detail: "Each of you holds half the clues, so the only way through is to talk. That replaces “hi”.",
        href: "/chats/s_aarav__s_sneha?tab=spark",
        visit: /^\/chats\/s_aarav__s_sneha/,
      },
      {
        id: "date",
        title: "Accept Ishita's date plan",
        detail: "Both opted in, public venue only. Accepting issues a partner perk code (how we earn). Then create a share link for a friend.",
        href: "/chats/s_aarav__s_ishita?tab=meet",
        visit: /^\/chats\/s_aarav__s_ishita/,
      },
      {
        id: "slots",
        title: "Three open slots, close kindly",
        detail: "The chats list shows 2 of 3 slots used. In any chat, the ⋯ menu has Close kindly, Report and Block.",
        href: "/chats",
        visit: /^\/chats$/,
      },
      {
        id: "vouch",
        title: "Your vouch codes",
        detail: "Three per member. A vouch is the only way past a city's waitlist. There's no paid shortcut. Vivek's story uses one.",
        href: "/me",
        visit: /^\/me$/,
      },
    ],
  },
  meera: {
    id: "meera",
    name: "Meera",
    theme: "Fairness and safety for women",
    steps: [
      {
        id: "cap",
        title: "The inbound like cap",
        detail: "10 likes delivered today, “2 more on the way”. Spreading attention fixes the 3:1 gender-ratio spiral at its root.",
        href: "/likes",
        visit: /^\/likes/,
      },
      {
        id: "scam",
        title: "Scam Shield on Vikram's chat",
        detail: "A crypto pitch, a push to Telegram and a UPI request, each flagged inline with one-tap report.",
        href: "/chats/s_meera__s_vikram",
        visit: /^\/chats\/s_meera__s_vikram/,
      },
      {
        id: "closed",
        title: "What closing kindly looks like",
        detail: "Aditya closed the chat with a kind note instead of disappearing. No ghosting by design.",
        href: "/chats/s_aditya__s_meera",
        visit: /^\/chats\/s_aditya__s_meera/,
      },
      {
        id: "privacy",
        title: "Hidden from colleagues",
        detail: "Hide-from-company is on, checked against her verified employer. Also try Download my data (DPDP Act).",
        href: "/settings",
        visit: /^\/settings/,
      },
      {
        id: "safety",
        title: "Safety centre",
        detail: "Five safety habits, emergency, women's and cyber-fraud helplines, and the grievance officer the IT Rules require.",
        href: "/safety",
        visit: /^\/safety/,
      },
    ],
  },
  kabir: {
    id: "kabir",
    name: "Kabir",
    theme: "Plus: convenience, never advantage",
    steps: [
      {
        id: "plus",
        title: "An honest Plus page",
        detail: "Free vs Plus side by side, ₹299/month, one-tap cancel. No boosts or visibility for sale.",
        href: "/plus",
        visit: /^\/plus/,
      },
      {
        id: "relocate",
        title: "Relocation mode",
        detail: "On the Plus page, switch to Bengaluru, then open Today: picks from the city he's moving to.",
        href: "/plus",
      },
      {
        id: "today",
        title: "Ten picks instead of five",
        detail: "Plus gives 10 picks and 5 open slots: more convenient, but no way to jump ahead of anyone.",
        href: "/today",
        visit: /^\/today/,
      },
    ],
  },
  vivek: {
    id: "vivek",
    name: "Vivek",
    theme: "The go-to-market plan, enforced in code",
    steps: [
      {
        id: "line",
        title: "Why he's #3 in line",
        detail: "Hyderabad is open, but admitting another man now would take women below 40%. Cities open only at 1,500 verified members.",
        href: "/waitlist",
        visit: /^\/waitlist/,
      },
      {
        id: "vouch",
        title: "Skip the line with a vouch",
        detail: "Enter Aarav's code AARAV-7K2P. A verified member vouching is the only way past the line, and there's no paid shortcut.",
        // Ticked from server state (he is off the waitlist), not by a visit:
        // a redirect can pass through /today before landing on /waitlist.
        href: "/waitlist",
      },
    ],
  },
  admin: {
    id: "admin",
    name: "Founder",
    theme: "Owning the outcome: metrics, launches, revenue, trust",
    steps: [
      {
        id: "north",
        title: "North star and funnel",
        detail: "Weekly Meaningful Conversations (both send 8+ messages), not time in the app. The funnel runs from verified member to planned date.",
        href: "/admin#north-star",
        visit: /^\/admin/,
      },
      {
        id: "launch",
        title: "City launch control",
        detail: "Each city's progress to its 1,500-member line and the 40% women line. Admit next batch in Hyderabad admits exactly one man.",
        href: "/admin#launch",
      },
      {
        id: "revenue",
        title: "Who pays",
        detail: "Venues vs Plus, so we notice if we drift toward squeezing members. The venue pipeline comes from the For venues form.",
        href: "/admin#revenue",
      },
      {
        id: "economics",
        title: "Does a city pay for itself?",
        detail: "An interactive city P&L, net of GST and payment fees, with costs and break-even. Drag the assumptions: the conservative case needs seven cities.",
        href: "/admin#economics",
      },
      {
        id: "gate",
        title: "Go, iterate or stop",
        detail: "What must hold before we open the next city, and the kill lines written down before the data. It honestly says “too early”: the pilot is the seed, not 1,500 members.",
        href: "/admin#gate",
      },
      {
        id: "experiment",
        title: "A real A/B test, read honestly",
        detail: "H4 is randomised by a hash of the match id. The readout says “keep running”: the CI is wide and ~370 matches per arm are needed.",
        href: "/admin#experiment",
      },
      {
        id: "research",
        title: "What real people said",
        detail: "Answers to the anonymous /research survey from people in the segment, not the seed. Each claim is split by gender and only “holds” at 30+ answers.",
        href: "/admin#research",
      },
      {
        id: "moderation",
        title: "Moderation queue",
        detail: "Vikram was auto-reported by Scam Shield. Suspend, warn or dismiss, against IT Rules 2021 timelines.",
        href: "/admin#moderation",
      },
    ],
  },
};

/** Pages outside the app worth a look, shown under every guide. */
export const GUIDE_EXTRAS = [
  { label: "For venues: how we earn without charging members", href: "/partners" },
  { label: "Partner counter: PIN 4321, code PW-7Q4M2K", href: "/partners/redeem" },
  { label: "Founder's notes: why each decision", href: "/why" },
  { label: "The 2-minute user-research survey (anonymous)", href: "/research" },
];

export const GUIDE_ORDER: DemoAccountId[] = ["aarav", "meera", "kabir", "vivek", "admin"];

/** Steps the server can see are done, whatever this browser remembers. */
export function serverDoneSteps(account: DemoAccountId, user: { status: string }): string[] {
  if (account === "vivek" && user.status !== "waitlisted") return ["line", "vouch"];
  return [];
}

/** The demo account behind an email, if any. */
export function demoAccountFor(email: string | undefined): DemoAccountId | null {
  if (!email?.endsWith("@pairwise.demo")) return null;
  const id = email.slice(0, -"@pairwise.demo".length) as DemoAccountId;
  return id in GUIDES ? id : null;
}
