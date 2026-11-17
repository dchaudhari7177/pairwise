import { describe, expect, it } from "vitest";
import { detect, evaluate } from "@/lib/safety/scam-shield";

const early = { matchAgeHours: 2, senderMessageCount: 3 };
const later = { matchAgeHours: 72, senderMessageCount: 40 };

describe("Scam Shield detection", () => {
  it.each([
    ["Can you send me 5000 rs, I'll return it tomorrow", "money"],
    ["My hospital bill is due, please help", "money"],
    ["I'm stuck at the airport, customs fee is pending", "money"],
    ["Pay ₹2,000 to unlock", "money"],
    ["I made 3x on this crypto trading platform, guaranteed returns", "crypto"],
    ["You should invest in this app, the returns are amazing", "crypto"],
    ["My UPI is rahul.k@okaxis", "upi"],
    ["call me on 98765 43210", "phone"],
    ["+91-9876543210", "phone"],
    ["let's continue on WhatsApp", "offplatform"],
    ["add me on telegram", "offplatform"],
    ["check this https://bit.ly/abc", "link"],
  ])("flags %j as %s", (text, signal) => {
    expect(detect(text)).toContain(signal);
  });

  it.each([
    "I spent 5000 steps walking around Cubbon Park today",
    "My team's sprint ends on the 15th",
    "Haha my mom sends me money-plant cuttings every month",
    "I've been learning to trade-off between work and gym",
    "Do you play chess? I'm rated 1400",
    "The movie was 2 hours 45 minutes long",
  ])("does not flag ordinary chat: %j", (text) => {
    expect(detect(text)).toEqual([]);
  });
});

describe("Scam Shield verdicts", () => {
  it("strikes and warns the receiver for money, crypto or UPI", () => {
    const v = evaluate("send 10000 rs to my UPI rahul@ybl", later);
    expect(v.strike).toBe(true);
    expect(v.receiverTip).toMatch(/Never send money/);
  });

  it("asks the sender to confirm sharing contact details early, but not later", () => {
    expect(evaluate("my number is 9876543210", early).confirmPrompt).toBeDefined();
    expect(evaluate("my number is 9876543210", later).confirmPrompt).toBeUndefined();
    expect(evaluate("my number is 9876543210", later).strike).toBe(false);
  });

  it("stays silent for normal messages", () => {
    expect(evaluate("That trek sounds lovely! Which route?", early)).toEqual({ signals: [], strike: false });
  });
});
