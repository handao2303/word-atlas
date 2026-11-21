import assert from "node:assert/strict";
import { test } from "node:test";
import initSqlJs from "sql.js";
import { compareResults, runQuery } from "./check";
import { ALL_SQL_EXERCISES, ALL_SQL_PROBLEMS, SQL_LESSONS } from "./lessons";
import { seedSql } from "./seed";

const SQL = await initSqlJs();
const db = new SQL.Database();
db.exec(seedSql());

test("every reference solution runs and returns rows", () => {
  for (const ex of ALL_SQL_EXERCISES) {
    const r = runQuery(db, ex.solution);
    assert.ok(r.rows.length > 0, `${ex.id} returned no rows`);
    assert.equal(compareResults(r, r, ex.ordered).ok, true);
  }
});

test("ids are unique and every lesson has exercises and LeetCode links", () => {
  assert.equal(new Set(ALL_SQL_EXERCISES.map((e) => e.id)).size, ALL_SQL_EXERCISES.length);
  assert.equal(new Set(ALL_SQL_PROBLEMS.map((p) => p.num)).size, ALL_SQL_PROBLEMS.length);
  for (const l of SQL_LESSONS) assert.ok(l.exercises.length >= 3 && l.leetcode.length >= 3, l.id);
});

test("the checker accepts equivalent answers and rejects wrong ones", () => {
  const want = runQuery(db, "SELECT status, COUNT(*) FROM orders GROUP BY status");
  assert.equal(compareResults(runQuery(db, "SELECT status, COUNT(*) AS n FROM orders GROUP BY status ORDER BY 2"), want).ok, true);
  assert.equal(compareResults(runQuery(db, "SELECT status FROM orders GROUP BY status"), want).ok, false);
  const ordered = runQuery(db, "SELECT name FROM products ORDER BY price DESC LIMIT 3");
  const v = compareResults(runQuery(db, "SELECT name FROM products ORDER BY price DESC LIMIT 3"), ordered, true);
  assert.equal(v.ok, true);
  const wrongOrder = compareResults(runQuery(db, "SELECT name FROM (SELECT name, price FROM products ORDER BY price DESC LIMIT 3) ORDER BY price"), ordered, true);
  assert.deepEqual(wrongOrder, { ok: false, reason: "Right rows, wrong order. Check your ORDER BY." });
});
