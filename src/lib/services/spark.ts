import { badRequest, conflict } from "../errors";
import { checkAnswer, choosePuzzle, getPuzzle } from "../spark/puzzles";
import type { DocStore } from "../store/types";
import type { Match, Message, SparkState, User } from "../types";
import { assertActive, loadMatch } from "./matches";
import { assertCanInteract, newId } from "./users";

const sys = (matchId: string, text: string, now: number, kind: Message["kind"] = "spark"): Message => ({
  id: newId(`${matchId}_s`),
  matchId,
  from: "system",
  kind,
  text,
  createdAt: now,
});

export async function startSpark(store: DocStore, viewer: User, matchId: string, now = Date.now()) {
  assertCanInteract(viewer);
  const m = await loadMatch(store, viewer, matchId, now);
  assertActive(m);
  if (m.spark && !m.spark.solvedAt) throw conflict("You already have a Spark in progress.", "spark_in_progress");
  const played = m.spark?.played ?? [];
  const puzzle = choosePuzzle(played, `${matchId}:${played.length}`);
  if (!puzzle) throw conflict("You two have solved every Spark we have. Impressive! New ones drop every month.", "spark_exhausted");
  const otherId = m.members.find((x) => x !== viewer.id)!;
  const spark: SparkState = {
    puzzleId: puzzle.id,
    startedBy: viewer.id,
    startedAt: now,
    roles: { [viewer.id]: "A", [otherId]: "B" },
    attempts: 0,
    played: [...played, puzzle.id],
  };
  await store.batch([
    { type: "update", col: "matches", id: matchId, patch: { spark, lastMessageAt: now, lastMessageBy: "system", lastMessagePreview: `🧩 Spark: ${puzzle.title}` } },
    { type: "set", col: "messages", id: `${matchId}_spark_${puzzle.id}`, data: sys(matchId, `🧩 ${viewer.profile!.firstName} started a Spark: “${puzzle.title}”. You each have half the clues. Compare notes!`, now) },
  ]);
  return puzzle.id;
}

export async function submitSpark(store: DocStore, viewer: User, matchId: string, answer: string, now = Date.now()) {
  assertCanInteract(viewer);
  const m: Match = await loadMatch(store, viewer, matchId, now);
  assertActive(m);
  if (!m.spark) throw badRequest("Start a Spark first.");
  if (m.spark.solvedAt) throw conflict("Already solved. Nice work!", "spark_solved");
  const puzzle = getPuzzle(m.spark.puzzleId)!;
  const correct = checkAnswer(puzzle, answer);
  if (!correct) {
    await store.update("matches", matchId, { "spark.attempts": m.spark.attempts + 1 });
    return { correct: false, attempts: m.spark.attempts + 1 };
  }
  const minutes = Math.max(1, Math.round((now - m.spark.startedAt) / 60000));
  const pretty = puzzle.kind === "choice" ? puzzle.options.find((o) => o.id === puzzle.answer)!.label : String(puzzle.answer);
  await store.batch([
    { type: "update", col: "matches", id: matchId, patch: { "spark.solvedAt": now, "spark.solvedBy": viewer.id, lastMessageAt: now, lastMessageBy: "system", lastMessagePreview: "🎉 Spark solved together" } },
    {
      type: "set",
      col: "messages",
      id: `${matchId}_solved_${puzzle.id}`,
      data: sys(matchId, `🎉 Solved together in ${minutes} min${minutes === 1 ? "" : "s"}${m.spark.attempts ? ` (after ${m.spark.attempts} wrong guess${m.spark.attempts === 1 ? "" : "es"})` : ""}! The answer was ${pretty}.`, now),
    },
  ]);
  return { correct: true, attempts: m.spark.attempts };
}
