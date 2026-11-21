import { ArrowRight, CodeXml, RotateCcw } from "lucide-react";
import { dueIds, nextNew, useLc } from "../leetcode/progress";
import { go } from "../lib/router";
import { useLcIndex } from "../pages/Code";

/** Home-page card: the LeetCode problem to do today (a due re-solve first, otherwise the next new one). */
export function LeetCodeToday() {
  const { ix } = useLcIndex();
  const progress = useLc((p) => p);
  if (!ix) return null;
  const due = dueIds(progress).filter((id) => ix.problems[id]);
  const id = due[0] ?? nextNew(progress, ix.order);
  const solved = ix.order.filter((x) => progress.cards[x]).length;
  const p = id ? ix.problems[id] : null;
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
      {p ? (
        <>
          <p className="lc-today-kind">{due.length ? `Re-solve · ${due.length} due` : "Next problem"}</p>
          <a className="lc-today-title" href={`#/code/p/${p.id}`}>
            {p.num !== null && <span className="lc-num">{p.num}.</span>} {p.title}
          </a>
          <div className="chips">
            <span className={`chip lc-level lc-${p.level.toLowerCase()}`}>{p.level}</span>
            {p.tags.slice(0, 2).map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="lc-today-title">Every problem is solved. Nice work.</p>
      )}
      <div className="lc-today-foot">
        <span className="lc-meter" style={{ "--k": solved / ix.order.length } as React.CSSProperties}>
          <i />
        </span>
        <small>
          {solved}/{ix.order.length} solved
        </small>
        {p && (
          <button className="btn btn-primary" onClick={() => go({ page: "code", doc: `p/${p.id}` })}>
            {due.length ? (
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
    </section>
  );
}
