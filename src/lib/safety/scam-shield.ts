import type { ScamSignal } from "../types";

/**
 * Scam Shield: lightweight, explainable detection of the patterns behind
 * most romance scams in India: asking for money, UPI handles, "investment"
 * and crypto pitches, and pushing the chat off-platform before trust exists.
 *
 * Deliberately rule-based for v1: every flag can be explained to the user and
 * to a moderator, and there are no false "AI says you're a scammer" moments.
 * A trained classifier can replace `detect` later behind the same interface.
 */

const PATTERNS: Record<ScamSignal, RegExp[]> = {
  money: [
    /\b(send|transfer|lend|borrow|need)\b[^.?!]{0,30}\b(money|cash|rs\.?|inr|rupees|₹|\d{3,}\s?(rs|inr|rupees))/i,
    /\b(loan|emergency fund|hospital bill|medical emergency|customs (fee|duty|charges)|stuck at (the )?airport)\b/i,
    /\bgift card\b/i,
    /₹\s?\d[\d,]{2,}/,
    /\b\d+\s?(lakh|lakhs|crore|k)\b.*\b(send|pay|transfer|need)\b/i,
  ],
  crypto: [
    /\b(crypto|bitcoin|btc|usdt|ethereum|binance|forex|trading (app|platform|group)|guaranteed returns?|double your (money|investment))\b/i,
    /\binvest(ment)?\b[^.?!]{0,40}\b(returns?|profit|platform|app)\b/i,
  ],
  upi: [/\b[\w.-]{2,}@(ok(axis|sbi|hdfcbank|icici)|ybl|ibl|axl|paytm|upi|apl|fbl|kotak|icici|sbi)\b/i],
  phone: [/(\+?91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b/],
  offplatform: [
    /\b(whats\s?app|telegram|snap(chat)?|insta(gram)?|signal|wechat|line app)\b/i,
    /\b(dm|text|message|ping|add) me (on|at)\b/i,
  ],
  link: [/\bhttps?:\/\/\S+/i, /\b[\w-]+\.(xyz|top|click|link|app|io|ly)\/\S*/i],
};

export function detect(text: string): ScamSignal[] {
  const found: ScamSignal[] = [];
  for (const [signal, patterns] of Object.entries(PATTERNS) as [ScamSignal, RegExp[]][]) {
    if (patterns.some((p) => p.test(text))) found.push(signal);
  }
  return found;
}

export interface ShieldContext {
  /** Hours since the match was created. */
  matchAgeHours: number;
  /** Messages the sender has already sent in this match. */
  senderMessageCount: number;
}

export interface ShieldVerdict {
  signals: ScamSignal[];
  /**
   * Ask the sender to confirm before sending, for sharing contact details
   * very early. This is a nudge, not a ban: plenty of good people move to
   * WhatsApp, just usually not in the first ten minutes.
   */
  confirmPrompt?: string;
  /** Show the receiver a safety tip alongside the message. */
  receiverTip?: string;
  /** Counts toward automatic moderation review. */
  strike: boolean;
}

const EARLY = (ctx: ShieldContext) => ctx.matchAgeHours < 24 || ctx.senderMessageCount < 10;

export function evaluate(text: string, ctx: ShieldContext): ShieldVerdict {
  const signals = detect(text);
  const verdict: ShieldVerdict = { signals, strike: false };

  if (signals.includes("money") || signals.includes("crypto") || signals.includes("upi")) {
    verdict.strike = true;
    verdict.receiverTip =
      "Never send money, UPI payments or 'investments' to someone you haven't met. Real matches don't ask. You can report this in one tap.";
  } else if (signals.includes("link")) {
    verdict.receiverTip = "Be careful with links from people you've just met. Don't enter passwords or payment details.";
  } else if ((signals.includes("offplatform") || signals.includes("phone")) && EARLY(ctx)) {
    verdict.receiverTip =
      "Moving off Pairwise this early removes your safety tools (reporting, blocking, Scam Shield). Take your time.";
  }

  if ((signals.includes("phone") || signals.includes("offplatform")) && EARLY(ctx)) {
    verdict.confirmPrompt =
      "You're sharing contact details quite early. Once you leave Pairwise, we can't help if something goes wrong. Send anyway?";
  }

  return verdict;
}

/** Strikes before an automatic report reaches the moderation queue. */
export const AUTO_REPORT_STRIKES = 3;
