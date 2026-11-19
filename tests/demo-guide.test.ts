import { describe, expect, it } from "vitest";
import { demoAccountFor, GUIDE_ORDER, GUIDES, serverDoneSteps } from "@/lib/demo-guide";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, seedDemo } from "@/lib/seed";
import { getConversation } from "@/lib/services/matches";
import { login } from "@/lib/services/users";
import { MemoryStore } from "@/lib/store/memory";
import type { Match } from "@/lib/types";

const NOW = Date.parse("2026-11-17T06:00:00Z");

describe("in-app evaluator guide", () => {
  it("has a guide for every demo account, and only for demo accounts", () => {
    expect(GUIDE_ORDER.map((id) => `${id}@pairwise.demo`).sort()).toEqual(DEMO_ACCOUNTS.map((a) => a.email).sort());
    for (const a of DEMO_ACCOUNTS) expect(demoAccountFor(a.email)).not.toBeNull();
    expect(demoAccountFor("diya@pairwise.demo")).toBeNull();
    expect(demoAccountFor("aarav@example.com")).toBeNull();
    expect(demoAccountFor(undefined)).toBeNull();
  });

  it("every step that ticks itself off does so on the screen it links to", () => {
    for (const g of Object.values(GUIDES)) {
      for (const s of g.steps) {
        if (!s.visit) continue;
        const target = s.href.split(/[?#]/)[0];
        expect(s.visit.test(target), `${g.id}/${s.id}`).toBe(true);
      }
    }
  });

  it("Vivek's vouch step completes only once he is actually off the waitlist", () => {
    expect(serverDoneSteps("vivek", { status: "waitlisted" })).toEqual([]);
    expect(serverDoneSteps("vivek", { status: "active" })).toEqual(["line", "vouch"]);
    expect(serverDoneSteps("aarav", { status: "active" })).toEqual([]);
  });

  it("every chat a guide links to exists in the seeded demo and belongs to that account", async () => {
    const store = new MemoryStore();
    await seedDemo(store, NOW);
    for (const g of Object.values(GUIDES)) {
      const chatLinks = g.steps.map((s) => s.href.match(/^\/chats\/([^?#]+)/)?.[1]).filter(Boolean) as string[];
      if (chatLinks.length === 0) continue;
      const viewer = await login(store, `${g.id}@pairwise.demo`, DEMO_PASSWORD);
      for (const id of chatLinks) {
        const match = await store.get<Match>("matches", id);
        expect(match, `${g.id} → ${id}`).not.toBeNull();
        expect(match!.members).toContain(viewer.id);
        await expect(getConversation(store, viewer, id)).resolves.toBeTruthy();
      }
    }
  });
});
