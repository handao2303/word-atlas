import { ArrowLeft, ArrowRight, Check, CheckCircle2, Circle, Clock, Database, Eye, Info, Play, RotateCcw, Table2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { dueIds, forget, grade, intervalEn, passSql, useLc } from "../leetcode/progress";
import type { QueryResult } from "../leetcode/sql/check";
import { ALL_SQL_PROBLEMS, sqlCardId, SQL_LESSONS, type SqlExercise, type SqlLesson, type SqlProblem } from "../leetcode/sql/lessons";
import { SCHEMA } from "../leetcode/sql/seed";
import { go } from "../lib/router";
import { preview } from "../store/srs";
import { GRADES, LevelChip, PathTabs } from "./Code";

const lessonDone = (l: SqlLesson, passed: string[]) => l.exercises.every((e) => passed.includes(e.id));

/* ---------- roadmap ---------- */

export function SqlRoadmap() {
  const p = useLc((x) => x);
  const now = Date.now();
  const sqlIds = new Set(ALL_SQL_PROBLEMS.map((x) => sqlCardId(x.num)));
  const due = dueIds(p, now).filter((id) => sqlIds.has(id));
  const solved = ALL_SQL_PROBLEMS.filter((x) => p.cards[sqlCardId(x.num)]).length;
  const exTotal = SQL_LESSONS.reduce((n, l) => n + l.exercises.length, 0);
  const lessonsDone = SQL_LESSONS.filter((l) => lessonDone(l, p.sql)).length;
  const next = SQL_LESSONS.find((l) => !lessonDone(l, p.sql) || l.leetcode.some((x) => !p.cards[sqlCardId(x.num)]));
  const dueProblem = due.length ? ALL_SQL_PROBLEMS.find((x) => sqlCardId(x.num) === due[0]) : null;

  return (
    <div className="page code" lang="en">
      <header className="page-head">
        <p className="eyebrow">LeetCode · SQL for BA</p>
        <h1 className="display">SQL for business analysts.</h1>
        <p className="lede">
          {SQL_LESSONS.length} short lessons, from SELECT to funnels and cohorts. Each one explains a single idea, lets you query a sample shop database right here in the browser, then
          lists the LeetCode SQL problems that test it.
        </p>
      </header>
      <PathTabs active="sql" />

      <section className="lc-hero">
        <div className="lc-stats">
          <div>
            <b>
              {lessonsDone}
              <small>/{SQL_LESSONS.length}</small>
            </b>
            <span>Lessons done</span>
          </div>
          <div>
            <b>
              {p.sql.length}
              <small>/{exTotal}</small>
            </b>
            <span>Sandbox exercises</span>
          </div>
          <div>
            <b>
              {solved}
              <small>/{ALL_SQL_PROBLEMS.length}</small>
            </b>
            <span>LeetCode SQL{due.length ? ` · ${due.length} due` : ""}</span>
          </div>
        </div>
        <div className="lc-next">
          {dueProblem ? (
            <>
              <p className="eyebrow">Re-solve first</p>
              <a className="lc-next-title" href={`https://leetcode.com/problems/${dueProblem.slug}/`} target="_blank" rel="noopener noreferrer">
                <span className="lc-num">{dueProblem.num}.</span> {dueProblem.title} <LevelChip level={dueProblem.level} />
              </a>
              <button className="btn btn-primary" onClick={() => go({ page: "code", doc: `sql/${SQL_LESSONS.find((l) => l.leetcode.includes(dueProblem))!.id}` })}>
                <RotateCcw size={17} /> Open the lesson to rate it
              </button>
            </>
          ) : next ? (
            <>
              <p className="eyebrow">{p.sql.length ? "Continue" : "Start here"}</p>
              <a className="lc-next-title" href={`#/code/sql/${next.id}`}>
                <span className="lc-num">{String(SQL_LESSONS.indexOf(next) + 1).padStart(2, "0")}</span> {next.title}
              </a>
              <button className="btn btn-primary" onClick={() => go({ page: "code", doc: `sql/${next.id}` })}>
                {p.sql.length ? "Continue" : "Start lesson 1"} <ArrowRight size={17} />
              </button>
            </>
          ) : (
            <>
              <p className="eyebrow">All done</p>
              <p className="lc-next-title">Every lesson and problem is complete. Re-solves will show up here.</p>
            </>
          )}
        </div>
      </section>

      <p className="lc-callout">
        <Info size={16} />
        <span>
          The sandbox runs <b>SQLite</b>. LeetCode uses <b>MySQL</b> by default; each lesson lists the few functions that differ (dates, text).
        </span>
      </p>

      <ol className="sql-lessons">
        {SQL_LESSONS.map((l, i) => {
          const ex = l.exercises.filter((e) => p.sql.includes(e.id)).length;
          const lcDone = l.leetcode.filter((x) => p.cards[sqlCardId(x.num)]).length;
          const done = ex === l.exercises.length && lcDone === l.leetcode.length;
          return (
            <li key={l.id}>
              <a className={`sql-lesson-card ${done ? "is-done" : ""}`} href={`#/code/sql/${l.id}`}>
                <span className="sql-lesson-num">{done ? <Check size={16} /> : String(i + 1).padStart(2, "0")}</span>
                <span className="sql-lesson-main">
                  <b>{l.title}</b>
                  <small>{l.blurb}</small>
                  <span className="sql-concepts">
                    {l.concepts.slice(0, 4).map((c) => (
                      <code key={c}>{c}</code>
                    ))}
                  </span>
                </span>
                <span className="sql-lesson-progress">
                  <span title="Sandbox exercises">
                    <Database size={13} /> {ex}/{l.exercises.length}
                  </span>
                  <span title="LeetCode problems">
                    <CheckCircle2 size={13} /> {lcDone}/{l.leetcode.length}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
      <p className="muted lc-credit">
        Lessons, sample data and sandbox exercises were written for this app. LeetCode problems open on leetcode.com; their statements belong to LeetCode.
      </p>
    </div>
  );
}

/* ---------- lesson ---------- */

export function SqlLessonPage({ id }: { id: string }) {
  const index = SQL_LESSONS.findIndex((l) => l.id === id);
  const lesson = SQL_LESSONS[index];
  useEffect(() => {
    void import("../leetcode/sql/engine").then((m) => m.warmUp());
  }, []);
  if (!lesson)
    return (
      <div className="page" lang="en">
        <p className="muted">This lesson does not exist.</p>
        <a className="link" href="#/code/sql">
          Back to SQL lessons
        </a>
      </div>
    );
  const prev = SQL_LESSONS[index - 1];
  const next = SQL_LESSONS[index + 1];
  return (
    <div className="page code-doc sql-doc" lang="en">
      <a className="link lc-back" href="#/code/sql">
        <ArrowLeft size={16} /> SQL for BA
      </a>
      <header className="lc-doc-head">
        <p className="eyebrow">
          Lesson {index + 1} of {SQL_LESSONS.length}
        </p>
        <h1 className="display">{lesson.title}</h1>
        <div className="sql-concepts">
          {lesson.concepts.map((c) => (
            <code key={c}>{c}</code>
          ))}
        </div>
        <nav className="sql-steps" aria-label="Lesson sections">
          <a href="javascript:void 0" onClick={() => document.getElementById("learn")?.scrollIntoView({ behavior: "smooth" })}>
            1 · Learn
          </a>
          <a href="javascript:void 0" onClick={() => document.getElementById("practice")?.scrollIntoView({ behavior: "smooth" })}>
            2 · Practice here
          </a>
          <a href="javascript:void 0" onClick={() => document.getElementById("leetcode")?.scrollIntoView({ behavior: "smooth" })}>
            3 · Solve on LeetCode
          </a>
        </nav>
      </header>

      <section id="learn" className="sql-section">
        <LessonBody md={lesson.body} />
      </section>

      <section id="practice" className="sql-section">
        <h2 className="sql-h2">
          <Database size={20} /> Practice in the sandbox
        </h2>
        <Sandbox lesson={lesson} />
      </section>

      <section id="leetcode" className="sql-section">
        <h2 className="sql-h2">
          <CheckCircle2 size={20} /> Solve on LeetCode
        </h2>
        <p className="muted sql-section-lede">Open a problem, solve it in MySQL, then come back and rate the attempt. It will return for a re-solve later.</p>
        <ul className="sql-lc">
          {lesson.leetcode.map((x) => (
            <SqlProblemRow key={x.num} p={x} />
          ))}
        </ul>
      </section>

      <nav className="lc-pager" aria-label="Lessons">
        {prev ? (
          <a className="btn btn-ghost" href={`#/code/sql/${prev.id}`}>
            <ArrowLeft size={16} /> {prev.title}
          </a>
        ) : (
          <span />
        )}
        {next && (
          <a className="btn btn-ghost" href={`#/code/sql/${next.id}`}>
            {next.title} <ArrowRight size={16} />
          </a>
        )}
      </nav>
    </div>
  );
}

const DUMMY_CTX = { src: "sql/lesson.md", repo: "", commit: "", files: {} };

function LessonBody({ md }: { md: string }) {
  const [html, setHtml] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void import("../leetcode/render").then(({ renderMarkdown }) => live && setHtml(renderMarkdown(md, DUMMY_CTX)));
    return () => {
      live = false;
    };
  }, [md]);
  return html === null ? <span className="spinner" /> : <article className="md" dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ---------- sandbox ---------- */

const draftKey = (id: string) => `word-atlas:sql-draft:${id}`;
const readDraft = (id: string) => {
  try {
    return localStorage.getItem(draftKey(id));
  } catch {
    return null;
  }
};
const saveDraft = (id: string, v: string) => {
  try {
    localStorage.setItem(draftKey(id), v);
  } catch {
    /* ignore */
  }
};
const starter = (ex: SqlExercise) => `-- ${ex.prompt}\nSELECT \n`;

type Outcome =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "error"; message: string }
  | { kind: "result"; result: QueryResult; ms?: number; verdict?: { ok: boolean; reason?: string } };

function Sandbox({ lesson }: { lesson: SqlLesson }) {
  const passed = useLc((p) => p.sql);
  const firstOpen = Math.max(0, lesson.exercises.findIndex((e) => !passed.includes(e.id)));
  const [i, setI] = useState(firstOpen);
  const ex = lesson.exercises[i];
  const [code, setCode] = useState(() => readDraft(ex.id) ?? starter(ex));
  const [out, setOut] = useState<Outcome>({ kind: "idle" });
  const [showSolution, setShowSolution] = useState(false);
  const [solutionHtml, setSolutionHtml] = useState<string | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setCode(readDraft(ex.id) ?? starter(ex));
    setOut({ kind: "idle" });
    setShowSolution(false);
  }, [ex]);

  useEffect(() => {
    if (!showSolution) return;
    void import("../leetcode/render").then((m) => setSolutionHtml(m.highlightSql(formatSql(ex.solution))));
  }, [showSolution, ex]);

  const run = async (checkIt: boolean) => {
    setOut({ kind: "busy" });
    const engine = await import("../leetcode/sql/engine");
    if (!checkIt) {
      const r = await engine.execute(code);
      setOut("error" in r ? { kind: "error", message: r.error } : { kind: "result", result: r.result, ms: r.ms });
      return;
    }
    const v = await engine.check(code, ex.solution, ex.ordered);
    if (v.error) return setOut({ kind: "error", message: v.error });
    if (v.ok) passSql(ex.id);
    setOut({ kind: "result", result: v.result!, verdict: v.ok ? { ok: true } : { ok: false, reason: v.reason } });
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void run(e.shiftKey);
    } else if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      const t = e.currentTarget;
      const { selectionStart: a, selectionEnd: b } = t;
      const v = `${code.slice(0, a)}  ${code.slice(b)}`;
      setCode(v);
      saveDraft(ex.id, v);
      requestAnimationFrame(() => t.setSelectionRange(a + 2, a + 2));
    }
  };

  const done = passed.includes(ex.id);
  return (
    <div className="sbx">
      <div className="sbx-tabs" role="tablist" aria-label="Exercises">
        {lesson.exercises.map((e, k) => (
          <button key={e.id} role="tab" aria-selected={k === i} className={`sbx-tab ${k === i ? "is-on" : ""} ${passed.includes(e.id) ? "is-done" : ""}`} onClick={() => setI(k)}>
            {passed.includes(e.id) ? <Check size={14} /> : null} Exercise {k + 1}
          </button>
        ))}
      </div>

      <div className="sbx-grid">
        <div className="sbx-main">
          <p className="sbx-prompt">
            <b>Task.</b> {ex.prompt}
            {ex.ordered && <span className="chip">order matters</span>}
            {done && <span className="chip chip-status is-done">Passed</span>}
          </p>
          <textarea
            ref={area}
            className="sbx-editor"
            value={code}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="SQL editor"
            rows={Math.min(14, Math.max(6, code.split("\n").length + 1))}
            onChange={(e) => {
              setCode(e.target.value);
              saveDraft(ex.id, e.target.value);
            }}
            onKeyDown={onKey}
          />
          <div className="sbx-actions">
            <button className="btn btn-ghost" onClick={() => void run(false)} disabled={out.kind === "busy"}>
              <Play size={16} /> Run <kbd>⌘↵</kbd>
            </button>
            <button className="btn btn-primary" onClick={() => void run(true)} disabled={out.kind === "busy"}>
              <Check size={16} /> Check answer <kbd>⇧⌘↵</kbd>
            </button>
            <span className="sbx-spacer" />
            <button className="link" onClick={() => setShowSolution((s) => !s)}>
              <Eye size={15} /> {showSolution ? "Hide" : "Show"} solution
            </button>
            <button
              className="link"
              onClick={() => {
                setCode(starter(ex));
                saveDraft(ex.id, starter(ex));
                area.current?.focus();
              }}
            >
              <RotateCcw size={15} /> Reset
            </button>
          </div>

          {showSolution && solutionHtml !== null && (
            <pre className="sbx-solution">
              <code className="hljs" dangerouslySetInnerHTML={{ __html: solutionHtml }} />
            </pre>
          )}

          <Output out={out} onNext={i < lesson.exercises.length - 1 ? () => setI(i + 1) : undefined} />
        </div>
        <SchemaPanel />
      </div>
    </div>
  );
}

/** Puts each main clause on its own line for the solution view. */
function formatSql(sql: string) {
  return sql
    .replace(/\s+(FROM|WHERE|GROUP BY|HAVING|ORDER BY|LIMIT|LEFT JOIN|JOIN|UNION)\s/g, "\n$1 ")
    .replace(/\)\s+SELECT\s/g, ")\nSELECT ");
}

function friendly(msg: string) {
  if (/incomplete input/i.test(msg)) return "The query is incomplete. Finish the statement (e.g. SELECT … FROM …).";
  const col = /no such column: (.+)/i.exec(msg);
  if (col) return `There is no column called ${col[1]}. Check the Tables panel for the exact names.`;
  const tbl = /no such table: (.+)/i.exec(msg);
  if (tbl) return `There is no table called ${tbl[1]}. Available tables: customers, products, orders, order_items, web_events, employees.`;
  return msg;
}

function Output({ out, onNext }: { out: Outcome; onNext?: () => void }) {
  if (out.kind === "idle") return <p className="sbx-empty">Run a query to see the result here. Each run starts from a fresh copy of the data, so experiments are safe.</p>;
  if (out.kind === "busy")
    return (
      <p className="sbx-empty">
        <span className="spinner" /> Running…
      </p>
    );
  if (out.kind === "error")
    return (
      <p className="sbx-verdict is-bad" role="alert">
        <b>SQL error.</b> {friendly(out.message)}
      </p>
    );
  const { result, verdict } = out;
  return (
    <div className="sbx-out">
      {verdict &&
        (verdict.ok ? (
          <p className="sbx-verdict is-ok" role="status">
            <CheckCircle2 size={18} /> <b>Correct.</b> Your result matches the expected answer.
            {onNext && (
              <button className="btn btn-sage" onClick={onNext}>
                Next exercise <ArrowRight size={15} />
              </button>
            )}
          </p>
        ) : (
          <p className="sbx-verdict is-bad" role="status">
            <b>Not yet.</b> {verdict.reason}
          </p>
        ))}
      {result.columns.length === 0 ? (
        <p className="sbx-empty">The statement ran but returned no table.</p>
      ) : (
        <>
          <div className="sbx-table">
            <table>
              <thead>
                <tr>
                  {result.columns.map((c, k) => (
                    <th key={k}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.slice(0, 200).map((r, k) => (
                  <tr key={k}>
                    {r.map((v, j) => (
                      <td key={j} className={typeof v === "number" ? "num" : v === null ? "null" : ""}>
                        {v === null ? "NULL" : String(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="sbx-meta">
            {result.rows.length} row{result.rows.length === 1 ? "" : "s"}
            {result.rows.length > 200 ? " (showing 200)" : ""}
            {out.ms !== undefined ? ` · ${Math.max(1, Math.round(out.ms))} ms` : ""}
          </p>
        </>
      )}
    </div>
  );
}

function SchemaPanel() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <aside className="sbx-schema" aria-label="Database tables">
      <p className="eyebrow">
        <Table2 size={14} /> Tables
      </p>
      {SCHEMA.map((t) => (
        <details key={t.name} open={open === t.name} onToggle={(e) => (e.currentTarget.open ? setOpen(t.name) : open === t.name && setOpen(null))}>
          <summary>
            <code>{t.name}</code>
          </summary>
          <p className="muted">{t.blurb}</p>
          <ul>
            {t.columns.map(([c, d]) => (
              <li key={c}>
                <code>{c}</code>
                <small>{d}</small>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </aside>
  );
}

/* ---------- LeetCode SQL problem row with inline rating ---------- */

function SqlProblemRow({ p }: { p: SqlProblem }) {
  const id = sqlCardId(p.num);
  const card = useLc((x) => x.cards[id]);
  const [open, setOpen] = useState(false);
  const now = Date.now();
  const status = !card ? "todo" : card.due <= now ? "due" : "solved";
  const iv = useMemo(() => preview(card, now, 0.9, false), [card]); // eslint-disable-line react-hooks/exhaustive-deps
  const Icon = status === "solved" ? CheckCircle2 : status === "due" ? Clock : Circle;
  return (
    <li className={`sql-lc-row is-${status} ${open ? "is-open" : ""}`}>
      <div className="sql-lc-main">
        <Icon size={18} className="lc-status" aria-label={status === "solved" ? "Solved" : status === "due" ? "Due to re-solve" : "To do"} />
        <span className="lc-num">{p.num}</span>
        <a className="lc-title" href={`https://leetcode.com/problems/${p.slug}/`} target="_blank" rel="noopener noreferrer">
          {p.title}
        </a>
        <LevelChip level={p.level} />
        <button className={`btn ${open ? "btn-ghost" : "btn-ghost"} sql-rate-btn`} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {card ? (status === "due" ? "Re-solve" : "Rate again") : "Rate"}
        </button>
      </div>
      {card && !open && status === "solved" && <p className="sql-lc-note">Next re-solve in {intervalEn(card.due - now)}</p>}
      {open && (
        <div className="sql-lc-rate">
          {GRADES.map(([g, label, cls]) => (
            <button
              key={g}
              className={`lc-grade is-${cls}`}
              onClick={() => {
                grade(id, g);
                setOpen(false);
              }}
            >
              <b>{label}</b>
              <small>again in {intervalEn(iv[g])}</small>
            </button>
          ))}
          {card && (
            <button className="link lc-reset" onClick={() => (forget(id), setOpen(false))}>
              Reset
            </button>
          )}
        </div>
      )}
    </li>
  );
}
