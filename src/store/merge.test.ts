import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeProgress } from "./merge";
import { emptyProgress } from "./store";
import type { CardState } from "./srs";

const card = (last: number, reps: number): CardState => ({ due: last + 1, s: 1, d: 5, el: 0, sd: 1, ls: 0, reps, lapses: 0, st: 2, last, seen: 1 });

test("keeps the most recently reviewed card from either side", () => {
  const a = { ...emptyProgress("x"), cards: { cat: card(200, 3), dog: card(50, 1) } };
  const b = { ...emptyProgress("x"), cards: { cat: card(100, 2), dog: card(90, 2), fox: card(10, 1) } };
  const m = mergeProgress(a, b, true);
  assert.equal(m.cards.cat.last, 200);
  assert.equal(m.cards.dog.last, 90);
  assert.ok(m.cards.fox);
});

test("day stats take the max, lists follow the newer copy, session stays local", () => {
  const a = { ...emptyProgress("x"), days: { "2026-11-18": { n: 5, r: 2, c: 2, t: 60 } }, bookmarks: ["a"] };
  const b = { ...emptyProgress("x"), days: { "2026-11-18": { n: 3, r: 9, c: 7, t: 30 } }, bookmarks: ["b"] };
  const m = mergeProgress(a, b, false);
  assert.deepEqual(m.days["2026-11-18"], { n: 5, r: 9, c: 7, t: 60 });
  assert.deepEqual(m.bookmarks, ["b"]);
  assert.equal(m.session, null);
});

test("merging is idempotent", () => {
  const a = { ...emptyProgress("x"), cards: { cat: card(200, 3) } };
  const once = mergeProgress(a, a, true);
  assert.deepEqual(mergeProgress(once, a, true).cards, a.cards);
});
