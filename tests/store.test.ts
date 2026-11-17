import { describe, expect, it } from "vitest";
import { MemoryStore } from "@/lib/store/memory";
import { del, inc } from "@/lib/store/types";

describe("MemoryStore", () => {
  it("returns copies, so callers cannot mutate stored state", async () => {
    const s = new MemoryStore();
    await s.set("users", "u1", { name: "Meera", tags: ["a"] });
    const doc = await s.get<{ name: string; tags: string[] }>("users", "u1");
    doc!.tags.push("b");
    expect((await s.get<{ tags: string[] }>("users", "u1"))!.tags).toEqual(["a"]);
  });

  it("supports dotted updates, increments and deletes", async () => {
    const s = new MemoryStore();
    await s.set("matches", "m", { unread: { a: 1 }, note: "x" });
    await s.update("matches", "m", { "unread.a": inc(2), "unread.b": inc(1), note: del() });
    expect(await s.get("matches", "m")).toEqual({ unread: { a: 3, b: 1 } });
  });

  it("filters with ==, in, array-contains and ranges", async () => {
    const s = new MemoryStore();
    await s.set("likes", "1", { to: "a", at: 5, members: ["a", "b"] });
    await s.set("likes", "2", { to: "b", at: 9, members: ["b", "c"] });
    expect(await s.query("likes", [["to", "==", "a"]])).toHaveLength(1);
    expect(await s.query("likes", [["to", "in", ["a", "b"]]])).toHaveLength(2);
    expect(await s.query("likes", [["members", "array-contains", "c"]])).toHaveLength(1);
    expect(await s.query("likes", [["at", ">", 5]])).toHaveLength(1);
  });

  it("applies a batch all-or-nothing", async () => {
    const s = new MemoryStore();
    await expect(
      s.batch([
        { type: "set", col: "a", id: "1", data: { v: 1 } },
        { type: "update", col: "a", id: "missing", patch: { v: 2 } },
      ]),
    ).rejects.toThrow();
    expect(await s.get("a", "1")).toBeNull();
  });

  it("drops undefined fields like Firestore's ignoreUndefinedProperties", async () => {
    const s = new MemoryStore();
    await s.set("a", "1", { v: 1, gone: undefined });
    expect(await s.get("a", "1")).toEqual({ v: 1 });
  });
});
