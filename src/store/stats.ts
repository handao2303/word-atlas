import { isMastered } from "./srs";
import { dayKey, type DayStat, type Progress } from "./store";

export function streakOf(days: Record<string, { r: number }>, today = new Date()) {
  let n = 0;
  const d = new Date(today);
  if (!(days[dayKey(d)]?.r > 0)) d.setDate(d.getDate() - 1);
  while (days[dayKey(d)]?.r > 0) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Public summary each learner shares on the leaderboard (no word-level data). */
export interface PublicStats {
  learned: number;
  mastered: number;
  streak: number;
  /** Most recent day with answers, so viewers can tell a streak has lapsed. */
  lastDay: string | null;
  /** The last 8 days of activity, keyed by local date. */
  days: Record<string, Pick<DayStat, "n" | "r" | "c">>;
  at: number;
}

export function publicStats(p: Progress, now = new Date()): PublicStats {
  const cards = Object.values(p.cards);
  const days: PublicStats["days"] = {};
  const d = new Date(now);
  for (let i = 0; i < 8; i++) {
    const k = dayKey(d);
    const s = p.days[k];
    if (s && (s.r || s.n)) days[k] = { n: s.n, r: s.r, c: s.c };
    d.setDate(d.getDate() - 1);
  }
  const active = Object.keys(p.days)
    .filter((k) => p.days[k].r > 0)
    .sort();
  return {
    learned: cards.length,
    mastered: cards.filter(isMastered).length,
    streak: streakOf(p.days, now),
    lastDay: active.at(-1) ?? null,
    days,
    at: now.getTime(),
  };
}

export type Metric = "week" | "mastered" | "learned" | "streak";

/** Value of a metric as seen today by the viewer (stale weeks and lapsed streaks count as 0). */
export function metricValue(s: Partial<PublicStats> | null | undefined, metric: Metric, now = new Date()): number {
  if (!s) return 0;
  if (metric === "mastered") return s.mastered ?? 0;
  if (metric === "learned") return s.learned ?? 0;
  if (metric === "streak") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return s.lastDay && s.lastDay >= dayKey(y) ? (s.streak ?? 0) : 0;
  }
  let sum = 0;
  const d = new Date(now);
  for (let i = 0; i < 7; i++) {
    sum += s.days?.[dayKey(d)]?.r ?? 0;
    d.setDate(d.getDate() - 1);
  }
  return sum;
}
