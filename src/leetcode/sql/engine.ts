/** Browser SQL sandbox: SQLite (sql.js) loaded on demand. Every run starts from a fresh copy of the sample database. */
import initSqlJs, { type SqlJsStatic } from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm-browser.wasm?url";
import { compareResults, runQuery, type QueryResult, type Verdict } from "./check";
import { seedSql } from "./seed";

let ready: Promise<{ SQL: SqlJsStatic; image: Uint8Array }> | null = null;

function boot() {
  ready ??= initSqlJs({ locateFile: () => wasmUrl } as unknown as Parameters<typeof initSqlJs>[0])
    .then((SQL) => {
      const db = new SQL.Database();
      db.exec(seedSql());
      const image = db.export();
      db.close();
      return { SQL, image };
    })
    .catch((e) => {
      ready = null;
      throw e;
    });
  return ready;
}

async function withDb<T>(fn: (db: import("sql.js").Database) => T): Promise<T> {
  const { SQL, image } = await boot();
  const db = new SQL.Database(image);
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

export const warmUp = () => void boot().catch(() => null);

export async function execute(sql: string): Promise<{ result: QueryResult; ms: number } | { error: string }> {
  try {
    const t = performance.now();
    const result = await withDb((db) => runQuery(db, sql));
    return { result, ms: performance.now() - t };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function check(sql: string, solution: string, ordered?: boolean): Promise<Verdict & { result?: QueryResult; error?: string }> {
  try {
    // Separate copies, so a learner's UPDATE or DELETE cannot change the expected answer.
    const want = await withDb((db) => runQuery(db, solution));
    const got = await withDb((db) => runQuery(db, sql));
    return { ...compareResults(got, want, ordered), result: got };
  } catch (e) {
    return { ok: false, reason: (e as Error).message, error: (e as Error).message };
  }
}
