import { ArrowLeft, ArrowRight, BookOpen, Brain, Check, Database, ExternalLink, FlaskConical, Github, Layers, PlayCircle, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ALL_DE_CARDS, ALL_DE_EXERCISES, DE_MODULES, deCardId, HANDBOOK, type ConceptCard, type DeLink, type DeModule } from "../leetcode/de/modules";
import { dueIds, grade, intervalEn, useLc, type LcProgress } from "../leetcode/progress";
import { go } from "../lib/router";
import { preview } from "../store/srs";
import { GRADES, PathTabs } from "./Code";
import { LessonBody, Sandbox } from "./Sql";

const moduleState = (m: DeModule, p: LcProgress) => {
  const cards = m.cards.filter((c) => p.cards[deCardId(m.id, c.id)]).length;
  const ex = m.exercises.filter((e) => p.sql.includes(e.id)).length;
  return { cards, ex, done: cards === m.cards.length && ex === m.exercises.length, started: cards + ex > 0 };
};

const deDue = (p: LcProgress, now = Date.now()) => {
  const keys = new Set(ALL_DE_CARDS.map((c) => c.key));
  return dueIds(p, now).filter((id) => keys.has(id));
};

/* ---------- roadmap ---------- */

export function DeRoadmap() {
  const p = useLc((x) => x);
  const due = deDue(p);
  const states = DE_MODULES.map((m) => moduleState(m, p));
  const done = states.filter((s) => s.done).length;
  const learned = ALL_DE_CARDS.filter((c) => p.cards[c.key]).length;
  const nextIdx = states.findIndex((s) => !s.done);
  const next = nextIdx >= 0 ? DE_MODULES[nextIdx] : null;
  const tracks = [...new Set(DE_MODULES.map((m) => m.track))];

  return (
    <div className="page code" lang="en">
      <header className="page-head">
        <p className="eyebrow">Code & Data · Data Engineering</p>
        <h1 className="display">Become a data engineer.</h1>
        <p className="lede">
          {DE_MODULES.length} modules from warehouses to streaming, in the order of the free DataExpert.io boot camp. Read a short lesson, lock the ideas in with concept cards that come
          back for review, practise the SQL patterns in the sandbox, then go deeper with the handbook's labs and homework.
        </p>
      </header>
      <PathTabs active="de" />

      <section className="lc-hero">
        <div className="lc-stats">
          <div>
            <b>
              {done}
              <small>/{DE_MODULES.length}</small>
            </b>
            <span>Modules done</span>
          </div>
          <div>
            <b>
              {learned}
              <small>/{ALL_DE_CARDS.length}</small>
            </b>
            <span>Concept cards</span>
          </div>
          <div>
            <b>
              {ALL_DE_EXERCISES.filter((e) => p.sql.includes(e.id)).length}
              <small>/{ALL_DE_EXERCISES.length}</small>
            </b>
            <span>SQL labs</span>
          </div>
        </div>
        <div className="lc-next">
          {due.length > 0 ? (
            <>
              <p className="eyebrow">Review first</p>
              <p className="lc-next-title">
                {due.length} concept card{due.length === 1 ? "" : "s"} due
              </p>
              <button className="btn btn-primary" onClick={() => go({ page: "code", doc: "de/review" })}>
                <Brain size={17} /> Review now
              </button>
            </>
          ) : next ? (
            <>
              <p className="eyebrow">{states.some((s) => s.started) ? "Continue" : "Start here"}</p>
              <a className="lc-next-title" href={`#/code/de/${next.id}`}>
                <span className="lc-num">{String(nextIdx + 1).padStart(2, "0")}</span> {next.title}
              </a>
              <button className="btn btn-primary" onClick={() => go({ page: "code", doc: `de/${next.id}` })}>
                Open module <ArrowRight size={17} />
              </button>
            </>
          ) : (
            <>
              <p className="eyebrow">All modules done</p>
              <p className="lc-next-title">Cards will come back here when they are due.</p>
            </>
          )}
        </div>
      </section>

      <div className="de-tracks">
        {tracks.map((t) => (
          <section key={t} className="de-track">
            <h2 className="de-track-title">{t}</h2>
            <ol className="de-modules">
              {DE_MODULES.map((m, i) => ({ m, i, s: states[i] }))
                .filter((x) => x.m.track === t)
                .map(({ m, i, s }) => (
                  <li key={m.id}>
                    <a className={`sql-lesson-card ${s.done ? "is-done" : ""}`} href={`#/code/de/${m.id}`}>
                      <span className="sql-lesson-num">{s.done ? <Check size={16} /> : String(i + 1).padStart(2, "0")}</span>
                      <span className="sql-lesson-main">
                        <b>{m.title}</b>
                        <small>{m.blurb}</small>
                      </span>
                      <span className="sql-lesson-progress">
                        <span title="Concept cards">
                          <Brain size={13} /> {s.cards}/{m.cards.length}
                        </span>
                        {m.exercises.length > 0 && (
                          <span title="SQL labs">
                            <Database size={13} /> {s.ex}/{m.exercises.length}
                          </span>
                        )}
                        <span title="Links to go deeper">
                          <Github size={13} /> {m.links.length}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
            </ol>
          </section>
        ))}
      </div>

      <p className="muted lc-credit">
        Lessons, cards and labs are written for this app. The module order follows DataExpert.io's free boot camp; "Go deeper" links open the{" "}
        <a className="link" href={HANDBOOK} target="_blank" rel="noopener noreferrer">
          DataExpert-io/data-engineer-handbook
        </a>{" "}
        repository and free lessons on dataexpert.io.
      </p>
    </div>
  );
}

/* ---------- module ---------- */

export function DeModulePage({ id }: { id: string }) {
  const idx = DE_MODULES.findIndex((m) => m.id === id);
  const m = DE_MODULES[idx];
  useEffect(() => {
    if (m?.exercises.length) void import("../leetcode/sql/engine").then((e) => e.warmUp());
  }, [m]);
  if (!m)
    return (
      <div className="page" lang="en">
        <p className="muted">This module does not exist.</p>
        <a className="link" href="#/code/de">
          Back to Data Engineering
        </a>
      </div>
    );
  const prev = DE_MODULES[idx - 1];
  const next = DE_MODULES[idx + 1];
  const steps: [string, string][] = [
    ["learn", "Learn"],
    ["cards", "Check yourself"],
    ...(m.exercises.length ? ([["practice", "SQL lab"]] as [string, string][]) : []),
    ["deeper", "Go deeper"],
  ];
  return (
    <div className="page code-doc sql-doc" lang="en">
      <a className="link lc-back" href="#/code/de">
        <ArrowLeft size={16} /> Data Engineering
      </a>
      <header className="lc-doc-head">
        <p className="eyebrow">
          Module {idx + 1} of {DE_MODULES.length} · {m.track}
        </p>
        <h1 className="display">{m.title}</h1>
        <p className="lede">{m.blurb}</p>
        <nav className="sql-steps" aria-label="Module sections">
          {steps.map(([sid, label], k) => (
            <a key={sid} href="javascript:void 0" onClick={() => document.getElementById(sid)?.scrollIntoView({ behavior: "smooth" })}>
              {k + 1} · {label}
            </a>
          ))}
        </nav>
      </header>

      <section id="learn" className="sql-section">
        <LessonBody md={m.body} />
      </section>

      <section id="cards" className="sql-section">
        <h2 className="sql-h2">
          <Brain size={20} /> Check yourself
        </h2>
        <p className="muted sql-section-lede">Answer in your head, flip the card, then rate yourself. Cards come back for review on the Data Engineering page.</p>
        <CardDeck module={m} />
      </section>

      {m.exercises.length > 0 && (
        <section id="practice" className="sql-section">
          <h2 className="sql-h2">
            <FlaskConical size={20} /> SQL lab
          </h2>
          <p className="muted sql-section-lede">The same sample shop database as the SQL path. Each run starts from a fresh copy.</p>
          <Sandbox lesson={m} />
        </section>
      )}

      <section id="deeper" className="sql-section">
        <h2 className="sql-h2">
          <Layers size={20} /> Go deeper
        </h2>
        <ul className="de-links">
          {m.links.map((l) => (
            <LinkRow key={l.href} l={l} />
          ))}
        </ul>
      </section>

      <nav className="lc-pager" aria-label="Modules">
        {prev ? (
          <a className="btn btn-ghost" href={`#/code/de/${prev.id}`}>
            <ArrowLeft size={16} /> {prev.title}
          </a>
        ) : (
          <span />
        )}
        {next && (
          <a className="btn btn-ghost" href={`#/code/de/${next.id}`}>
            {next.title} <ArrowRight size={16} />
          </a>
        )}
      </nav>
    </div>
  );
}

const LINK_META: Record<DeLink["kind"], [string, typeof BookOpen]> = {
  handbook: ["Handbook", Github],
  lab: ["Lab code", Database],
  homework: ["Homework", FlaskConical],
  video: ["Free video", PlayCircle],
  reading: ["Reading", BookOpen],
};

function LinkRow({ l }: { l: DeLink }) {
  const [label, Icon] = LINK_META[l.kind];
  return (
    <li>
      <a className="de-link" href={l.href} target="_blank" rel="noopener noreferrer">
        <span className={`de-link-icon is-${l.kind}`}>
          <Icon size={17} />
        </span>
        <span className="de-link-text">
          <b>{l.label}</b>
          <small>{label}</small>
        </span>
        <ExternalLink size={15} className="de-link-out" />
      </a>
    </li>
  );
}

/* ---------- flash cards ---------- */

function Flashcard({ card, cardKey, onRated }: { card: ConceptCard; cardKey: string; onRated?: () => void }) {
  const state = useLc((p) => p.cards[cardKey]);
  const [flipped, setFlipped] = useState(false);
  const now = Date.now();
  const iv = useMemo(() => preview(state, now, 0.9, false), [state]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={`fc ${flipped ? "is-flipped" : ""}`}>
      <button className="fc-face" onClick={() => setFlipped((f) => !f)} aria-expanded={flipped}>
        <span className="fc-q">{card.q}</span>
        {flipped ? <span className="fc-a">{card.a}</span> : <span className="fc-hint">Tap to reveal the answer</span>}
        {state && !flipped && <span className="fc-meta">Next review in {intervalEn(Math.max(0, state.due - now))}</span>}
      </button>
      {flipped && (
        <div className="fc-grades">
          {GRADES.map(([g, label, cls]) => (
            <button
              key={g}
              className={`lc-grade is-${cls}`}
              onClick={() => {
                grade(cardKey, g);
                setFlipped(false);
                onRated?.();
              }}
            >
              <b>{label === "Couldn't solve" ? "Forgot" : label === "Needed hints" ? "Hard" : label === "Solved" ? "Got it" : "Easy"}</b>
              <small>again in {intervalEn(iv[g])}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CardDeck({ module: m }: { module: DeModule }) {
  const p = useLc((x) => x);
  const firstNew = m.cards.findIndex((c) => !p.cards[deCardId(m.id, c.id)]);
  const [i, setI] = useState(Math.max(0, firstNew));
  const card = m.cards[i];
  return (
    <div className="fc-deck">
      <div className="fc-dots" role="tablist" aria-label="Cards">
        {m.cards.map((c, k) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={k === i}
            aria-label={`Card ${k + 1}`}
            className={`fc-dot ${k === i ? "is-on" : ""} ${p.cards[deCardId(m.id, c.id)] ? "is-done" : ""}`}
            onClick={() => setI(k)}
          />
        ))}
        <span className="fc-count">
          {i + 1} / {m.cards.length}
        </span>
      </div>
      <Flashcard key={card.id} card={card} cardKey={deCardId(m.id, card.id)} onRated={() => setI((k) => Math.min(m.cards.length - 1, k + 1))} />
    </div>
  );
}

export function DeReview() {
  const p = useLc((x) => x);
  const [queue] = useState(() => deDue(p));
  const [pos, setPos] = useState(0);
  const item = queue[pos] ? ALL_DE_CARDS.find((c) => c.key === queue[pos]) : null;
  const mod = item ? DE_MODULES.find((m) => m.id === item.module) : null;
  return (
    <div className="page code-doc" lang="en">
      <a className="link lc-back" href="#/code/de">
        <ArrowLeft size={16} /> Data Engineering
      </a>
      <header className="lc-doc-head">
        <p className="eyebrow">Concept review</p>
        <h1 className="display">{item ? `Card ${pos + 1} of ${queue.length}` : "All caught up."}</h1>
        {mod && (
          <p className="muted">
            From <a className="link" href={`#/code/de/${mod.id}`}>{mod.title}</a>
          </p>
        )}
      </header>
      {item ? (
        <Flashcard key={item.key} card={item} cardKey={item.key} onRated={() => setPos((x) => x + 1)} />
      ) : (
        <div className="panel">
          <p>{queue.length ? `You reviewed ${queue.length} card${queue.length === 1 ? "" : "s"}.` : "No cards are due right now."} New cards come from the "Check yourself" section of each module.</p>
          <button className="btn btn-primary" onClick={() => go({ page: "code", doc: "de" })}>
            <RotateCcw size={16} /> Back to modules
          </button>
        </div>
      )}
    </div>
  );
}
