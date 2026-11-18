import type { CardState } from "./srs";
import type { Progress } from "./store";

const cardTime = (c: CardState) => c.last ?? c.seen;

/** Combine two copies of the same dataset's progress. Reviews never get lost; lists follow the newer copy. */
export function mergeProgress(local: Progress, remote: Progress, localNewer: boolean): Progress {
  const cards = { ...remote.cards };
  for (const [id, c] of Object.entries(local.cards)) {
    const r = cards[id];
    if (!r || cardTime(c) > cardTime(r) || (cardTime(c) === cardTime(r) && c.reps >= r.reps)) cards[id] = c;
  }
  const days = { ...remote.days };
  for (const [k, d] of Object.entries(local.days)) {
    const r = days[k];
    days[k] = r ? { n: Math.max(d.n, r.n), r: Math.max(d.r, r.r), c: Math.max(d.c, r.c), t: Math.max(d.t, r.t) } : d;
  }
  const typing = [...new Map([...remote.typing, ...local.typing].map((t) => [t.at, t])).values()]
    .sort((a, b) => a.at - b.at)
    .slice(-500);
  const newer = localNewer ? local : remote;
  return { ...newer, cards, days, typing, session: local.session };
}

