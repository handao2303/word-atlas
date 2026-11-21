import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Circle, Clock, ExternalLink, Lock, RotateCcw, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadLcDoc, loadLcIndex, trackOf, type LcIndex, type LcProblem, type Level } from "../leetcode/data";
import { dueIds, forget, grade, intervalEn, nextNew, toggleRead, useLc, type LcProgress } from "../leetcode/progress";
import { go } from "../lib/router";
import { preview, Rating, type Grade } from "../store/srs";
import { ALL_SQL_PROBLEMS, sqlCardId, SQL_LESSONS } from "../leetcode/sql/lessons";
import { SqlLessonPage, SqlRoadmap } from "./Sql";

export function useLcIndex() {
  const [ix, setIx] = useState<LcIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    loadLcIndex().then(setIx, (e: Error) => setError(e.message));
  }, []);
  return { ix, error };
}

export function CodePage({ doc }: { doc?: string }) {
  const { ix, error } = useLcIndex();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [doc]);
  if (error)
    return (
      <div className="page">
        <p className="warn-text">Could not load the LeetCode track: {error}</p>
      </div>
    );
  if (!ix)
    return (
      <div className="page" aria-busy="true">
        <span className="spinner" />
      </div>
    );
  if (doc === "sql") return <SqlRoadmap />;
  if (doc?.startsWith("sql/")) return <SqlLessonPage key={doc} id={doc.slice(4)} />;
  return doc ? <DocPage key={doc} ix={ix} docRef={doc} /> : <Roadmap ix={ix} />;
}

/* ---------- path switcher (Algorithms / SQL for BA) ---------- */

export function PathTabs({ active }: { active: "algo" | "sql" }) {
  const p = useLc((x) => x);
  const [ix, setIx] = useState<LcIndex | null>(null);
  useEffect(() => {
    loadLcIndex().then(setIx, () => null);
  }, []);
  const algoTotal = ix?.order.length ?? 54;
  const algoDone = ix ? ix.order.filter((id) => p.cards[id]).length : 0;
  const sqlTotal = SQL_LESSONS.reduce((n, l) => n + l.exercises.length, 0) + ALL_SQL_PROBLEMS.length;
  const sqlDone = p.sql.length + ALL_SQL_PROBLEMS.filter((x) => p.cards[sqlCardId(x.num)]).length;
  const tabs = [
    { id: "algo", href: "#/code", title: "Algorithms", sub: `${algoTotal} problems · 14 tracks`, done: algoDone, total: algoTotal },
    { id: "sql", href: "#/code/sql", title: "SQL for BA", sub: `${SQL_LESSONS.length} lessons · sandbox · ${ALL_SQL_PROBLEMS.length} problems`, done: sqlDone, total: sqlTotal },
  ] as const;
  return (
    <nav className="lc-paths" aria-label="Learning path">
      {tabs.map((t) => (
        <a key={t.id} href={t.href} className={`lc-path ${active === t.id ? "is-on" : ""}`} aria-current={active === t.id ? "page" : undefined}>
          <span className="lc-path-icon" aria-hidden="true">
            {t.id === "algo" ? "{ }" : "SQL"}
          </span>
          <span className="lc-path-text">
            <b>{t.title}</b>
            <small>{t.sub}</small>
          </span>
          <span className="lc-meter" style={{ "--k": t.total ? t.done / t.total : 0 } as React.CSSProperties}>
            <i />
          </span>
        </a>
      ))}
    </nav>
  );
}

/* ---------- roadmap ---------- */

type Status = "all" | "todo" | "due" | "solved";

function statusOf(p: LcProgress, id: string, now: number) {
  const c = p.cards[id];
  if (!c) return "todo" as const;
  return c.due <= now ? ("due" as const) : ("solved" as const);
}

function Roadmap({ ix }: { ix: LcIndex }) {
  const progress = useLc((p) => p);
  const [level, setLevel] = useState<Level | "all">("all");
  const [status, setStatus] = useState<Status>("all");
  const [q, setQ] = useState("");
  const now = Date.now();
  const due = dueIds(progress, now).filter((id) => ix.problems[id]);
  const fresh = nextNew(progress, ix.order);
  const solved = ix.order.filter((id) => progress.cards[id]).length;
  const guidesRead = progress.read.filter((g) => ix.guides[g]).length;
  const total = ix.order.length;

  const match = (p: LcProblem) => {
    if (level !== "all" && p.level !== level) return false;
    if (status !== "all" && statusOf(progress, p.id, now) !== status) return false;
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return p.title.toLowerCase().includes(s) || String(p.num ?? "") === s || p.tags.some((t) => t.toLowerCase().includes(s));
  };
  const filtering = level !== "all" || status !== "all" || q.trim() !== "";

  return (
    <div className="page code" lang="en">
      <header className="page-head">
        <p className="eyebrow">LeetCode · Algorithms</p>
        <h1 className="display">One pattern at a time.</h1>
        <p className="lede">
          {total} classic problems and {Object.keys(ix.guides).length} topic guides, ordered from arrays to graphs. Read the guide, solve the problems on LeetCode, then rate how it went.
          Solved problems come back for a re-solve before you forget them.
        </p>
      </header>
      <PathTabs active="algo" />

      <section className="lc-hero">
        <div className="lc-stats">
          <div>
            <b>
              {solved}
              <small>/{total}</small>
            </b>
            <span>Solved</span>
          </div>
          <div>
            <b>{due.length}</b>
            <span>Due to re-solve</span>
          </div>
          <div>
            <b>
              {guidesRead}
              <small>/{Object.keys(ix.guides).length}</small>
            </b>
            <span>Guides read</span>
          </div>
        </div>
        <div className="lc-next">
          {due.length > 0 ? (
            <>
              <p className="eyebrow">Re-solve first</p>
              <ProblemLink ix={ix} id={due[0]} />
              <button className="btn btn-primary" onClick={() => go({ page: "code", doc: `p/${due[0]}` })}>
                <RotateCcw size={17} /> Re-solve now
              </button>
            </>
          ) : fresh ? (
            <>
              <p className="eyebrow">Up next</p>
              <ProblemLink ix={ix} id={fresh} />
              <button className="btn btn-primary" onClick={() => go({ page: "code", doc: `p/${fresh}` })}>
                Start <ArrowRight size={17} />
              </button>
            </>
          ) : (
            <>
              <p className="eyebrow">All solved</p>
              <p className="lc-next-title">Every problem in the track is done. Reviews will appear here when they are due.</p>
            </>
          )}
        </div>
      </section>

      <div className="lc-filters">
        <label className="lc-search">
          <Search size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, number or tag" aria-label="Search problems" />
        </label>
        <div className="chips">
          {(["all", "Easy", "Medium", "Hard"] as const).map((l) => (
            <button key={l} className={`chip-btn ${level === l ? "is-on" : ""}`} onClick={() => setLevel(l)} aria-pressed={level === l}>
              {l === "all" ? "All levels" : l}
            </button>
          ))}
        </div>
        <div className="chips">
          {(
            [
              ["all", "Any status"],
              ["todo", "To do"],
              ["due", "Due"],
              ["solved", "Solved"],
            ] as const
          ).map(([k, label]) => (
            <button key={k} className={`chip-btn ${status === k ? "is-on" : ""}`} onClick={() => setStatus(k)} aria-pressed={status === k}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <ol className="lc-tracks">
        {ix.tracks.map((t, i) => {
          const list = t.problems.map((id) => ix.problems[id]).filter(match);
          if (filtering && !list.length) return null;
          const done = t.problems.filter((id) => progress.cards[id]).length;
          return (
            <li key={t.id} className="panel lc-track">
              <div className="lc-track-head">
                <span className="lc-track-num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h2>{t.title}</h2>
                  <p className="muted">{t.blurb}</p>
                </div>
                {t.problems.length > 0 && (
                  <span className="lc-track-count" style={{ "--k": done / t.problems.length } as React.CSSProperties}>
                    {done}/{t.problems.length}
                  </span>
                )}
              </div>
              {!filtering && (
                <div className="lc-guides">
                  {t.guides.map((g) => (
                    <a key={g} className={`lc-guide ${progress.read.includes(g) ? "is-read" : ""}`} href={`#/code/g/${g}`}>
                      {progress.read.includes(g) ? <Check size={15} /> : <BookOpen size={15} />}
                      {ix.guides[g].title}
                      <small>{Math.max(1, Math.round(ix.guides[g].words / 220))} min</small>
                    </a>
                  ))}
                </div>
              )}
              {list.length > 0 && (
                <ul className="lc-problems">
                  {list.map((p) => (
                    <ProblemRow key={p.id} p={p} status={statusOf(progress, p.id, now)} />
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
      <Credit ix={ix} />
    </div>
  );
}

function ProblemLink({ ix, id }: { ix: LcIndex; id: string }) {
  const p = ix.problems[id];
  return (
    <a className="lc-next-title" href={`#/code/p/${id}`}>
      {p.num !== null && <span className="lc-num">{p.num}.</span>} {p.title} <LevelChip level={p.level} />
    </a>
  );
}

export const LevelChip = ({ level }: { level: Level }) => <span className={`chip lc-level lc-${level.toLowerCase()}`}>{level}</span>;

function ProblemRow({ p, status }: { p: LcProblem; status: "todo" | "due" | "solved" }) {
  const Icon = status === "solved" ? CheckCircle2 : status === "due" ? Clock : Circle;
  const label = status === "solved" ? "Solved" : status === "due" ? "Due to re-solve" : "To do";
  return (
    <li>
      <a className={`lc-row is-${status}`} href={`#/code/p/${p.id}`}>
        <Icon size={18} className="lc-status" aria-label={label} />
        <span className="lc-num">{p.num ?? "·"}</span>
        <span className="lc-title">
          {p.title}
          {p.premium && <Lock size={13} aria-label="LeetCode Premium" />}
        </span>
        <span className="lc-tags">{p.tags.slice(0, 2).join(" · ")}</span>
        <LevelChip level={p.level} />
      </a>
    </li>
  );
}

export function Credit({ ix }: { ix: LcIndex }) {
  const s = ix.source;
  return (
    <p className="muted lc-credit">
      Write-ups by {s.author}, from{" "}
      <a className="link" href={`https://github.com/${s.repo}`} target="_blank" rel="noopener noreferrer">
        {s.repo}
      </a>
      , shown unmodified under{" "}
      <a className="link" href={s.licenseUrl} target="_blank" rel="noopener noreferrer">
        {s.license}
      </a>
      . Only the English write-ups are included. Problem statements belong to LeetCode.
    </p>
  );
}

/* ---------- problem / guide page ---------- */

function DocPage({ ix, docRef }: { ix: LcIndex; docRef: string }) {
  const [kind, id] = docRef.split("/");
  const problem = kind === "p" ? ix.problems[id] : undefined;
  const guide = kind === "g" ? ix.guides[id] : undefined;
  const track = trackOf(ix, docRef);
  const [md, setMd] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (problem || guide) loadLcDoc(docRef).then(setMd, (e: Error) => setError(e.message));
  }, [docRef, problem, guide]);

  if (!problem && !guide)
    return (
      <div className="page" lang="en">
        <p className="muted">This page does not exist.</p>
        <a className="link" href="#/code">
          Back to the roadmap
        </a>
      </div>
    );

  const seq = ix.order;
  const pos = problem ? seq.indexOf(problem.id) : -1;
  const prev = pos > 0 ? seq[pos - 1] : null;
  const next = pos >= 0 && pos < seq.length - 1 ? seq[pos + 1] : null;
  const src = (problem ?? guide)!.src;

  return (
    <div className="page code-doc" lang="en">
      <a className="link lc-back" href="#/code">
        <ArrowLeft size={16} /> Roadmap{track ? ` · ${track.title}` : ""}
      </a>
      <header className="lc-doc-head">
        <p className="eyebrow">{problem ? `Problem${problem.num !== null ? ` ${problem.num}` : ""}` : "Topic guide"}</p>
        <h1 className="display">{(problem ?? guide)!.title}</h1>
        {problem && (
          <div className="chips">
            <LevelChip level={problem.level} />
            {problem.tags.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="lc-doc-actions">
          {problem && (
            <a className="btn btn-primary" href={problem.url} target="_blank" rel="noopener noreferrer">
              Solve on LeetCode <ExternalLink size={16} />
            </a>
          )}
          {guide && <ReadToggle id={guide.id} />}
        </div>
        {problem && <p className="muted lc-tip">Try it yourself first. Open the write-up below only when you are stuck or after you submit.</p>}
      </header>

      {problem ? (
        <>
          <RatePanel id={problem.id} />
          <details className="lc-spoiler">
            <summary>Show the write-up (idea, key points, code)</summary>
            <DocBody md={md} error={error} ix={ix} src={src} />
          </details>
        </>
      ) : (
        <>
          <DocBody md={md} error={error} ix={ix} src={src} />
          {guide && (
            <div className="lc-doc-end">
              <ReadToggle id={guide.id} />
            </div>
          )}
        </>
      )}

      {track && (
        <section className="panel lc-related">
          <h3 className="eyebrow">{track.title}</h3>
          <div className="lc-guides">
            {track.guides.map((g) => (
              <a key={g} className={`lc-guide ${g === id && kind === "g" ? "is-here" : ""}`} href={`#/code/g/${g}`}>
                <BookOpen size={15} /> {ix.guides[g].title}
              </a>
            ))}
          </div>
          {track.problems.length > 0 && (
            <ul className="lc-problems">
              {track.problems.map((pid) => (
                <RelatedRow key={pid} p={ix.problems[pid]} here={problem?.id === pid} />
              ))}
            </ul>
          )}
        </section>
      )}

      {problem && (
        <nav className="lc-pager" aria-label="Problems">
          {prev ? (
            <a className="btn btn-ghost" href={`#/code/p/${prev}`}>
              <ArrowLeft size={16} /> {ix.problems[prev].title}
            </a>
          ) : (
            <span />
          )}
          {next && (
            <a className="btn btn-ghost" href={`#/code/p/${next}`}>
              {ix.problems[next].title} <ArrowRight size={16} />
            </a>
          )}
        </nav>
      )}
      <Credit ix={ix} />
    </div>
  );
}

function RelatedRow({ p, here }: { p: LcProblem; here: boolean }) {
  const c = useLc((x) => x.cards[p.id]);
  const status = !c ? "todo" : c.due <= Date.now() ? "due" : "solved";
  return here ? (
    <li className="is-here">
      <span className="lc-row is-here">
        <ArrowRight size={18} className="lc-status" />
        <span className="lc-num">{p.num ?? "·"}</span>
        <span className="lc-title">{p.title}</span>
        <span className="lc-tags" />
        <LevelChip level={p.level} />
      </span>
    </li>
  ) : (
    <ProblemRow p={p} status={status} />
  );
}

function ReadToggle({ id }: { id: string }) {
  const read = useLc((p) => p.read.includes(id));
  return (
    <button className={`btn ${read ? "btn-sage" : "btn-ghost"}`} onClick={() => toggleRead(id)} aria-pressed={read}>
      {read ? (
        <>
          <Check size={16} /> Read
        </>
      ) : (
        <>
          <BookOpen size={16} /> Mark as read
        </>
      )}
    </button>
  );
}

export const GRADES: [Grade, string, string][] = [
  [Rating.Again, "Couldn't solve", "again"],
  [Rating.Hard, "Needed hints", "hard"],
  [Rating.Good, "Solved", "good"],
  [Rating.Easy, "Easy", "easy"],
];

function RatePanel({ id }: { id: string }) {
  const card = useLc((p) => p.cards[id]);
  const [just, setJust] = useState<Grade | null>(null);
  const now = Date.now();
  const iv = useMemo(() => preview(card, now, 0.9, false), [card]); // eslint-disable-line react-hooks/exhaustive-deps
  const due = card && card.due <= now;
  return (
    <section className="panel lc-rate" aria-label="Rate this attempt">
      <div className="lc-rate-head">
        <h3>{!card ? "How did it go?" : due ? "Time to re-solve this one." : "Solved"}</h3>
        <p className="muted">
          {!card
            ? "After you attempt it on LeetCode, rate yourself. The problem will come back at the right time."
            : due
              ? "Solve it again from scratch, then rate the attempt."
              : `Next re-solve in ${intervalEn(card.due - now)} (${new Date(card.due).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}). Solved ${card.reps} time${card.reps === 1 ? "" : "s"}.`}
        </p>
      </div>
      <div className="lc-grades">
        {GRADES.map(([g, label, cls]) => (
          <button
            key={g}
            className={`lc-grade is-${cls} ${just === g ? "is-on" : ""}`}
            onClick={() => {
              grade(id, g);
              setJust(g);
            }}
          >
            <b>{label}</b>
            <small>again in {intervalEn(iv[g])}</small>
          </button>
        ))}
      </div>
      {card && (
        <button className="link lc-reset" onClick={() => (forget(id), setJust(null))}>
          Reset this problem
        </button>
      )}
    </section>
  );
}

function DocBody({ md, error, ix, src }: { md: string | null; error: string | null; ix: LcIndex; src: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (md === null) return;
    let live = true;
    void import("../leetcode/render").then(({ renderMarkdown }) => {
      if (live) setHtml(renderMarkdown(md, { src, repo: ix.source.repo, commit: ix.source.commit, files: ix.files }));
    });
    return () => {
      live = false;
    };
  }, [md, src, ix]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Some upstream images live on a host that no longer serves them: hide those instead of showing broken icons.
    const onErr = (e: Event) => {
      if (e.target instanceof HTMLImageElement) e.target.classList.add("is-broken");
    };
    el.addEventListener("error", onErr, true);
    el.querySelectorAll("img").forEach((img) => img.complete && img.naturalWidth === 0 && img.classList.add("is-broken"));
    return () => el.removeEventListener("error", onErr, true);
  }, [html]);
  if (error) return <p className="warn-text">Could not load this write-up: {error}</p>;
  if (html === null) return <span className="spinner" />;
  return (
    <article
      ref={ref}
      className="md"
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={(e) => {
        const a = (e.target as HTMLElement).closest("a[data-anchor]");
        if (!a) return;
        e.preventDefault();
        const name = a.getAttribute("data-anchor")!.toLowerCase();
        const h = [...(ref.current?.querySelectorAll("h1,h2,h3,h4") ?? [])].find((x) => x.id.endsWith(name) || x.textContent?.trim().toLowerCase() === name);
        h?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    />
  );
}
