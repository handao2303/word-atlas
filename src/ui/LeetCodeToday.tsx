import { ArrowRight, CodeXml, Database, RotateCcw } from "lucide-react";
import { dueIds, nextNew, useLc } from "../leetcode/progress";
import { ALL_SQL_PROBLEMS, sqlCardId, SQL_LESSONS } from "../leetcode/sql/lessons";
import { go } from "../lib/router";
import { useLcIndex } from "../pages/Code";

/** Home-page card: today's algorithm problem and SQL lesson (due re-solves first). */
export function LeetCodeToday() {
  const { ix } = useLcIndex();
  const progress = useLc((p) => p);
  if (!ix) return null;
  const due = dueIds(progress);
  const algoDue = due.filter((id) => ix.problems[id]);
  const algoId = algoDue[0] ?? nextNew(progress, ix.order);
  const algo = algoId ? ix.problems[algoId] : null;
  const solved = ix.order.filter((x) => progress.cards[x]).length;

  const sqlDue = ALL_SQL_PROBLEMS.filter((x) => due.includes(sqlCardId(x.num)));
  const lesson =
    (sqlDue[0] && SQL_LESSONS.find((l) => l.leetcode.includes(sqlDue[0]))) ||
    SQL_LESSONS.find((l) => l.exercises.some((e) => !progress.sql.includes(e.id)) || l.leetcode.some((x) => !progress.cards[sqlCardId(x.num)]));
  const exTotal = SQL_LESSONS.reduce((n, l) => n + l.exercises.length, 0);

  return (
    <section className="panel lc-today" lang="en">
      <div className="panel-head">
        <h3 className="eyebrow">
          <CodeXml size={15} /> LeetCode today
        </h3>
        <a className="link" href="#/code">
          Roadmap
        </a>
      </div>

      <div className="lc-today-path">
        <p className="lc-today-kind">{algoDue.length ? `Algorithms · re-solve · ${algoDue.length} due` : "Algorithms · next problem"}</p>
        {algo ? (
          <a className="lc-today-title" href={`#/code/p/${algo.id}`}>
            {algo.num !== null && <span className="lc-num">{algo.num}.</span>} {algo.title}
          </a>
        ) : (
          <p className="lc-today-title">All problems solved.</p>
        )}
        <div className="lc-today-foot">
          <span className="lc-meter" style={{ "--k": solved / ix.order.length } as React.CSSProperties}>
            <i />
          </span>
          <small>
            {solved}/{ix.order.length} solved
          </small>
          {algo && (
            <button className="btn btn-primary" onClick={() => go({ page: "code", doc: `p/${algo.id}` })}>
              {algoDue.length ? (
                <>
                  <RotateCcw size={16} /> Re-solve
                </>
              ) : (
                <>
                  Solve <ArrowRight size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="lc-today-path">
        <p className="lc-today-kind">{sqlDue.length ? `SQL for BA · ${sqlDue.length} to re-solve` : "SQL for BA · next lesson"}</p>
        {lesson ? (
          <a className="lc-today-title" href={`#/code/sql/${lesson.id}`}>
            <span className="lc-num">{String(SQL_LESSONS.indexOf(lesson) + 1).padStart(2, "0")}</span> {lesson.title}
          </a>
        ) : (
          <p className="lc-today-title">Every SQL lesson is done.</p>
        )}
        <div className="lc-today-foot">
          <span className="lc-meter" style={{ "--k": progress.sql.length / exTotal } as React.CSSProperties}>
            <i />
          </span>
          <small>
            {progress.sql.length}/{exTotal} exercises
          </small>
          {lesson && (
            <button className="btn btn-ghost" onClick={() => go({ page: "code", doc: `sql/${lesson.id}` })}>
              <Database size={16} /> Open
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
