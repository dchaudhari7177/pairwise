import { describe, expect, it } from "vitest";
import { cleanSource, MIN_READING, QUESTIONS, responseSchema, scrubNote, summarise, type ResearchResponse, type ResponseInput } from "@/lib/research";
import { RESEARCH_COL, researchSummary, submitResponse } from "@/lib/services/research";
import { MemoryStore } from "@/lib/store/memory";
import { makeUser } from "./fixtures";

const NOW = Date.parse("2026-11-19T06:00:00Z");

const answer = (o: Partial<ResponseInput> = {}): ResponseInput => ({
  adult: true,
  age: "22-25",
  gender: "woman",
  city: "bengaluru",
  appUse: "stopped",
  pains: ["fake"],
  verified: "much",
  picks: "picks",
  spark: "yes",
  pay: "199",
  ...o,
});

let seq = 0;
const row = (o: Partial<ResearchResponse> = {}): ResearchResponse => ({
  id: `r${++seq}`,
  createdAt: NOW + seq,
  age: "22-25",
  gender: "woman",
  city: "bengaluru",
  appUse: "current",
  pains: ["fake"],
  verified: "much",
  picks: "picks",
  spark: "yes",
  pay: "0",
  src: "direct",
  ...o,
});

describe("research questionnaire", () => {
  it("every question names the decision it informs, and has distinct choices", () => {
    for (const q of QUESTIONS) {
      expect(q.informs.length).toBeGreaterThan(10);
      expect(new Set(q.choices.map((c) => c.value)).size).toBe(q.choices.length);
    }
  });

  it("is for adults only", () => {
    expect(() => responseSchema.parse({ ...answer(), adult: false })).toThrow(/18/);
  });

  it("accepts one or two pain points, never zero or three", () => {
    expect(() => responseSchema.parse(answer({ pains: [] }))).toThrow();
    expect(() => responseSchema.parse(answer({ pains: ["fake", "ghosting", "flood"] }))).toThrow();
    expect(responseSchema.parse(answer({ pains: ["fake", "ghosting"] })).pains).toHaveLength(2);
  });

  it("rejects bots that fill the hidden field, and unknown answers", () => {
    expect(() => responseSchema.parse(answer({ website: "http://spam" }))).toThrow();
    expect(() => responseSchema.parse({ ...answer(), pay: "1000" })).toThrow();
  });

  it("strips contact details from the free-text note", () => {
    expect(scrubNote("mail me at a.b+c@x.co.in or call +91 98450 12345, insta @priya_k")).toBe(
      "mail me at [removed] or call [removed], insta [removed]",
    );
    expect(scrubNote("₹299 is fine for 3 months")).toBe("₹299 is fine for 3 months");
  });

  it("keeps channel tags to a short slug", () => {
    expect(cleanSource("WhatsApp")).toBe("whatsapp");
    expect(cleanSource("<script>")).toBe("script");
    expect(cleanSource("")).toBe("direct");
    expect(cleanSource(undefined)).toBe("direct");
  });
});

describe("submitting", () => {
  it("stores no name, email or IP, and scrubs the note", async () => {
    const store = new MemoryStore();
    await submitResponse(store, answer({ note: "verified would help, ping me on 9845012345", src: "LinkedIn" }), NOW);
    const [saved] = await store.query<ResearchResponse>(RESEARCH_COL);
    expect(saved.note).toBe("verified would help, ping me on [removed]");
    expect(saved.src).toBe("linkedin");
    expect(Object.keys(saved).sort()).toEqual(
      ["age", "appUse", "city", "createdAt", "gender", "id", "note", "pains", "pay", "picks", "spark", "src", "verified"].sort(),
    );
  });

  it("only admins can read the summary", async () => {
    const store = new MemoryStore();
    await expect(researchSummary(store, makeUser())).rejects.toThrow(/Admins/);
    const s = await researchSummary(store, makeUser({ role: "admin" }));
    expect(s.n).toBe(0);
  });
});

describe("reading the answers", () => {
  it("is honest when there is nothing yet", () => {
    const s = summarise([]);
    expect(s.n).toBe(0);
    expect(s.pay.median).toBeNull();
    expect(s.readings.every((r) => r.holds === null)).toBe(true);
  });

  it("won't call a hypothesis until there are enough answers", () => {
    const s = summarise(Array.from({ length: MIN_READING - 1 }, () => row()));
    expect(s.readings.find((r) => r.id === "verified")!.all.pct).toBe(100);
    expect(s.readings.find((r) => r.id === "verified")!.holds).toBeNull();
  });

  it("calls it only when the low end of the interval clears the bar", () => {
    // 60% say verification helps: the point estimate clears 50%, but at n=40 the interval doesn't.
    const mixed = [...Array.from({ length: 24 }, () => row()), ...Array.from({ length: 16 }, () => row({ verified: "same" }))];
    expect(summarise(mixed).readings.find((r) => r.id === "verified")!.holds).toBe(false);
    const strong = Array.from({ length: 40 }, () => row());
    expect(summarise(strong).readings.find((r) => r.id === "verified")!.holds).toBe(true);
  });

  it("splits readings by gender", () => {
    const rs = [row({ gender: "woman", verified: "much" }), row({ gender: "man", verified: "same" }), row({ gender: "man", verified: "bit" })];
    const v = summarise(rs).readings.find((r) => r.id === "verified")!;
    expect(v.women).toMatchObject({ k: 1, n: 1, pct: 100 });
    expect(v.men).toMatchObject({ k: 1, n: 2, pct: 50 });
    expect(summarise(rs).byGender).toEqual({ woman: 1, man: 2, nonbinary: 0, na: 0 });
  });

  it("measures quitting only among people who used an app", () => {
    const rs = [row({ appUse: "stopped" }), row({ appUse: "current" }), row({ appUse: "never" }), row({ appUse: "never" })];
    expect(summarise(rs).readings.find((r) => r.id === "lapsed")!.all).toMatchObject({ k: 1, n: 2, pct: 50 });
  });

  it("ranks pain points and reads willingness to pay against the Plus price", () => {
    const rs = [
      row({ pains: ["fake", "ghosting"], pay: "0" }),
      row({ pains: ["fake"], pay: "99" }),
      row({ pains: ["privacy"], pay: "299" }),
      row({ pains: ["fake", "privacy"], pay: "499" }),
    ];
    const s = summarise(rs, 299);
    expect(s.pains[0]).toMatchObject({ value: "fake", count: 3, pct: 75 });
    expect(s.pains[1]).toMatchObject({ value: "privacy", count: 2 });
    expect(s.pay.median).toBe(199);
    expect(s.pay.atPlusPrice).toMatchObject({ k: 2, n: 4 });
    expect(s.pay.anything).toMatchObject({ k: 3, n: 4 });
  });

  it("counts channels and shows the newest notes first", () => {
    const rs = [row({ src: "whatsapp", note: "old" }), row({ src: "whatsapp" }), row({ src: "linkedin", note: "new" })];
    const s = summarise(rs);
    expect(s.channels).toEqual([{ src: "whatsapp", count: 2 }, { src: "linkedin", count: 1 }]);
    expect(s.notes.map((x) => x.text)).toEqual(["new", "old"]);
  });
});
