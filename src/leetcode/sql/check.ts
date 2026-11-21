/** Running and checking sandbox queries. Works with any sql.js Database (browser or Node). */
import type { Database, SqlValue } from "sql.js";

export interface QueryResult {
  columns: string[];
  rows: SqlValue[][];
}

/** Runs the statements and returns the last result set (empty if the last statement returned nothing). */
export function runQuery(db: Database, sql: string): QueryResult {
  const res = db.exec(sql);
  const last = res.at(-1);
  return last ? { columns: last.columns, rows: last.values } : { columns: [], rows: [] };
}

const cell = (v: SqlValue) => (v === null ? "∅" : typeof v === "number" ? (Math.round(v * 100) / 100).toString() : String(v));
const key = (row: SqlValue[]) => row.map(cell).join("␟");

export type Verdict = { ok: true } | { ok: false; reason: string };

/** Compares values only (column names are free). Row order matters only when ordered. */
export function compareResults(got: QueryResult, want: QueryResult, ordered = false): Verdict {
  if (got.columns.length !== want.columns.length)
    return { ok: false, reason: `Expected ${want.columns.length} column${want.columns.length === 1 ? "" : "s"}, got ${got.columns.length}.` };
  if (got.rows.length !== want.rows.length) return { ok: false, reason: `Expected ${want.rows.length} row${want.rows.length === 1 ? "" : "s"}, got ${got.rows.length}.` };
  const a = got.rows.map(key);
  const b = want.rows.map(key);
  if (ordered) {
    const i = a.findIndex((x, j) => x !== b[j]);
    if (i < 0) return { ok: true };
    const sameSet = [...a].sort().join() === [...b].sort().join();
    return { ok: false, reason: sameSet ? "Right rows, wrong order. Check your ORDER BY." : `Row ${i + 1} differs from the expected result.` };
  }
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((x, i) => x === sb[i]) ? { ok: true } : { ok: false, reason: "Same shape, but some values differ from the expected result." };
}
