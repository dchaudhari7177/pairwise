import { describe, expect, it } from "vitest";
import { PUZZLES, checkAnswer, choosePuzzle, playerView, solutions } from "@/lib/spark/puzzles";

describe.each(PUZZLES.map((p) => [p.title, p] as const))("Spark puzzle: %s", (_title, puzzle) => {
  it("has exactly one solution when both halves are combined, and it is the answer", () => {
    expect(solutions(puzzle, ["A", "B"])).toEqual([puzzle.answer]);
  });

  it("cannot be solved by either player alone", () => {
    expect(solutions(puzzle, ["A"]).length).toBeGreaterThan(1);
    expect(solutions(puzzle, ["B"]).length).toBeGreaterThan(1);
  });

  it("only reveals a player's own half of the clues", () => {
    const a = playerView(puzzle, "A");
    const b = playerView(puzzle, "B");
    expect(a.clues).toEqual(puzzle.clues.A.map((c) => c.text));
    expect(a.clues.some((c) => b.clues.includes(c))).toBe(false);
    expect(JSON.stringify(a)).not.toContain(`"answer"`);
  });

  it("accepts the answer case- and space-insensitively", () => {
    expect(checkAnswer(puzzle, ` ${String(puzzle.answer).toUpperCase()} `)).toBe(true);
    expect(checkAnswer(puzzle, "definitely-wrong")).toBe(false);
  });
});

describe("choosing a puzzle", () => {
  it("never repeats a puzzle the pair has played", () => {
    const played = PUZZLES.slice(0, -1).map((p) => p.id);
    expect(choosePuzzle(played, "seed")!.id).toBe(PUZZLES[PUZZLES.length - 1].id);
    expect(choosePuzzle(PUZZLES.map((p) => p.id), "seed")).toBeNull();
  });
});
