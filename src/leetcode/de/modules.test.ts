import assert from "node:assert/strict";
import { test } from "node:test";
import initSqlJs from "sql.js";
import { runQuery } from "../sql/check";
import { ALL_SQL_EXERCISES } from "../sql/lessons";
import { seedSql } from "../sql/seed";
import { ALL_DE_CARDS, ALL_DE_EXERCISES, DE_MODULES } from "./modules";

const SQL = await initSqlJs();
const db = new SQL.Database();
db.exec(seedSql());

test("every data engineering exercise runs and returns rows", () => {
  for (const ex of ALL_DE_EXERCISES) assert.ok(runQuery(db, ex.solution).rows.length > 0, ex.id);
});

test("ids are unique across modules, cards and the SQL path", () => {
  assert.equal(new Set(DE_MODULES.map((m) => m.id)).size, DE_MODULES.length);
  assert.equal(new Set(ALL_DE_CARDS.map((c) => c.key)).size, ALL_DE_CARDS.length);
  const ex = [...ALL_DE_EXERCISES, ...ALL_SQL_EXERCISES].map((e) => e.id);
  assert.equal(new Set(ex).size, ex.length);
  for (const m of DE_MODULES) assert.ok(m.cards.length >= 3 && m.links.length >= 2, m.id);
});
