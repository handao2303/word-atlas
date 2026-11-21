import assert from "node:assert/strict";
import { test } from "node:test";
import { review, Rating } from "../store/srs";
import { dueIds, emptyLc, lcStats, mergeLc, nextNew, sanitizeLc } from "./progress";

const t0 = Date.UTC(2026, 10, 20, 9);

test("mergeLc keeps the newest review per problem and unions read guides", () => {
  const a = { ...emptyLc(), cards: { "1": review(undefined, Rating.Good, t0) }, read: ["tree"], days: { "2026-11-20": 1 } };
  const later = review(a.cards["1"], Rating.Good, t0 + 86400000 * 3);
  const b = { ...emptyLc(), cards: { "1": later, "2": review(undefined, Rating.Hard, t0) }, read: ["bit"], days: { "2026-11-20": 2 } };
  const m = mergeLc(a, b);
  assert.equal(m.cards["1"].reps, later.reps);
  assert.ok(m.cards["2"]);
  assert.deepEqual([...m.read].sort(), ["bit", "tree"]);
  assert.deepEqual(mergeLc({ ...a, sql: ["select-1"] }, { ...b, sql: ["joins-2"] }).sql.sort(), ["joins-2", "select-1"]);
  assert.equal(m.days["2026-11-20"], 2);
});

test("due and next problems follow the study order", () => {
  const p = { ...emptyLc(), cards: { "1": review(undefined, Rating.Again, t0) } };
  assert.deepEqual(dueIds(p, t0 + 3600_000), ["1"]);
  assert.equal(nextNew(p, ["1", "26", "88"]), "26");
  assert.equal(lcStats(p, new Date(t0)).solved, 1);
});

test("re-solves are scheduled at least a day apart", () => {
  for (const g of [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy] as const) assert.ok(review(undefined, g, t0, 0.9, false).due - t0 >= 86400000 * 0.9);
});

test("sanitizeLc drops malformed data", () => {
  const p = sanitizeLc({ version: 1, cards: { x: { due: "soon" } }, read: ["a", "a", 3], days: { bad: 1, "2026-11-20": 2 } });
  assert.deepEqual(p.cards, {});
  assert.deepEqual(p.read, ["a"]);
  assert.deepEqual(p.days, { "2026-11-20": 2 });
});
