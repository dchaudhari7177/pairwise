import { DAY, isoWeek } from "../time";
import type { User } from "../types";
import { assess } from "./compatibility";

/**
 * Daily Picks: a short, curated list instead of an endless feed.
 *
 * Ranking = compatibility × attention balance × exposure boost × activity.
 *
 * - **Attention balance** is the key idea. On swipe apps a small share of
 *   profiles soak up most of the likes, and everyone else gets silence, which
 *   drives both groups away. If a candidate already has a big pile of unread
 *   likes, we show them to fewer new people. That spreads attention out and
 *   means the likes they do get are more likely to be seen.
 * - **Exposure boost** gives people who were shown less this week a fair turn.
 * - **Activity** prefers people who will actually see your like.
 * - **Diversity**: at most 2 picks from the same employer, so the list doesn't
 *   turn into one office.
 */

export interface Candidate {
  user: User;
  /** Likes waiting for this candidate to look at. */
  pendingInbound: number;
}

export interface Pick {
  uid: string;
  score: number;
  rank: number;
  reasons: string[];
}

export interface PickOptions {
  count: number;
  day: string;
  now?: number;
  /** Already liked, passed, matched or blocked. */
  excluded?: Set<string>;
  blocked?: Set<string>;
  minScore?: number;
}

export function attentionFactor(pendingInbound: number): number {
  return 1 / (1 + pendingInbound / 8);
}

export function exposureFactor(user: User, now: number): number {
  const count = user.exposure.week === isoWeek(now) ? user.exposure.count : 0;
  return 1 + 0.25 * (1 - Math.min(1, count / 25));
}

export function activityFactor(user: User, now: number): number {
  const days = (now - user.lastActiveAt) / DAY;
  if (days <= 3) return 1;
  if (days <= 14) return 0.85;
  return 0.6;
}

/** Small deterministic hash used as a tie-breaker, so a day's picks are stable. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 2 ** 32;
}

export function rankPicks(viewer: User, candidates: Candidate[], opts: PickOptions): Pick[] {
  const now = opts.now ?? Date.now();
  const minScore = opts.minScore ?? 30;
  const scored: Pick[] = [];

  for (const { user, pendingInbound } of candidates) {
    if (user.id === viewer.id || opts.excluded?.has(user.id)) continue;
    const a = assess(viewer, user, { now, blocked: opts.blocked });
    if (a.blockers.length > 0 || a.score < minScore) continue;
    const isNew = now - user.createdAt < 7 * DAY ? 1.1 : 1;
    const rank =
      a.score *
      attentionFactor(pendingInbound) *
      exposureFactor(user, now) *
      activityFactor(user, now) *
      isNew *
      (1 + 0.04 * hash(`${viewer.id}:${opts.day}:${user.id}`));
    scored.push({ uid: user.id, score: a.score, rank, reasons: a.reasons });
  }

  scored.sort((x, y) => y.rank - x.rank);

  const byId = new Map(candidates.map((c) => [c.user.id, c.user]));
  const perEmployer = new Map<string, number>();
  const picks: Pick[] = [];
  for (const p of scored) {
    const domain = byId.get(p.uid)?.verification.work?.domain;
    if (domain) {
      const n = perEmployer.get(domain) ?? 0;
      if (n >= 2) continue;
      perEmployer.set(domain, n + 1);
    }
    picks.push(p);
    if (picks.length >= opts.count) break;
  }
  return picks;
}
