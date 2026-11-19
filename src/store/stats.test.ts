import assert from "node:assert/strict";
import { test } from "node:test";
import { metricValue, publicStats } from "./stats";
import { emptyProgress } from "./store";

const at = new Date(2026, 10, 19, 12);

test("public stats summarise without word-level data", () => {
  const p = {
    ...emptyProgress("x"),
    cards: {
      a: { due: 1, s: 30, d: 5, el: 0, sd: 1, ls: 0, reps: 4, lapses: 0, st: 2 as const, last: 1, seen: 1 },
      b: { due: 1, s: 2, d: 5, el: 0, sd: 1, ls: 0, reps: 1, lapses: 0, st: 1 as const, last: 1, seen: 1 },
    },
    days: { "2026-11-19": { n: 2, r: 10, c: 8, t: 60 }, "2026-11-18": { n: 0, r: 5, c: 5, t: 30 }, "2026-11-01": { n: 1, r: 3, c: 1, t: 9 } },
  };
  const s = publicStats(p, at);
  assert.equal(s.learned, 2);
  assert.equal(s.mastered, 1);
  assert.equal(s.streak, 2);
  assert.equal(s.lastDay, "2026-11-19");
  assert.deepEqual(Object.keys(s.days).sort(), ["2026-11-18", "2026-11-19"]);
  assert.equal(metricValue(s, "week", at), 15);
});

test("stale stats: week and streak fall to zero for the viewer", () => {
  const s = { learned: 5, mastered: 1, streak: 4, lastDay: "2026-11-10", days: { "2026-11-10": { n: 1, r: 9, c: 9 } }, at: 0 };
  assert.equal(metricValue(s, "week", at), 0);
  assert.equal(metricValue(s, "streak", at), 0);
  assert.equal(metricValue(s, "learned", at), 5);
  assert.equal(metricValue(null, "week", at), 0);
});
