import { useSyncExternalStore } from "react";
import { review, type CardState, type Grade } from "../store/srs";
import { dayKey } from "../store/store";

/** LeetCode progress. Each solved problem is an FSRS card so it comes back for a re-solve. */
export interface LcProgress {
  version: 1;
  cards: Record<string, CardState>;
  /** Guides marked as read. */
  read: string[];
  /** Problems solved or re-solved per local day. */
  days: Record<string, number>;
  /** SQL sandbox exercises answered correctly. */
  sql: string[];
}

const KEY = "word-atlas:leetcode";
const CHANGED = "word-atlas:changed:leetcode";
export const emptyLc = (): LcProgress => ({ version: 1, cards: {}, read: [], days: {}, sql: [] });

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const n = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0;

export function sanitizeLc(v: unknown): LcProgress {
  const out = emptyLc();
  if (!isObj(v) || v.version !== 1) return out;
  if (isObj(v.cards))
    for (const [k, c] of Object.entries(v.cards))
      if (isObj(c) && n(c.due) && n(c.s) && n(c.d) && n(c.reps) && n(c.lapses) && [0, 1, 2, 3].includes(c.st as number) && n(c.seen))
        out.cards[k] = c as unknown as CardState;
  if (Array.isArray(v.read)) out.read = [...new Set(v.read.filter((x): x is string => typeof x === "string"))].slice(0, 500);
  if (Array.isArray(v.sql)) out.sql = [...new Set(v.sql.filter((x): x is string => typeof x === "string"))].slice(0, 1000);
  if (isObj(v.days)) for (const [k, d] of Object.entries(v.days)) if (/^\d{4}-\d{2}-\d{2}$/.test(k) && n(d)) out.days[k] = d as number;
  return out;
}

function read(): LcProgress {
  try {
    return sanitizeLc(JSON.parse(localStorage.getItem(KEY) || "null"));
  } catch {
    return emptyLc();
  }
}

let state = typeof localStorage === "undefined" ? emptyLc() : read();
const subs = new Set<() => void>();
const emit = () => subs.forEach((l) => l());

export function lcChangedAt() {
  try {
    return Number(localStorage.getItem(CHANGED)) || 0;
  } catch {
    return 0;
  }
}

function save(changedAt = Date.now()) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    localStorage.setItem(CHANGED, String(changedAt));
  } catch {
    /* storage full or blocked: keep in memory */
  }
}

if (typeof window !== "undefined")
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY || !e.newValue) return;
    try {
      state = sanitizeLc(JSON.parse(e.newValue));
      emit();
    } catch {
      /* ignore */
    }
  });

export const lc = {
  get: () => state,
  subscribe(l: () => void) {
    subs.add(l);
    return () => subs.delete(l);
  },
  update(fn: (p: LcProgress) => LcProgress) {
    state = fn(state);
    save();
    emit();
  },
  /** Replace with a merged copy from the cloud without bumping the change time. */
  adopt(p: LcProgress, changedAt: number) {
    state = p;
    save(changedAt);
    emit();
  },
};

export const useLc = <T>(select: (p: LcProgress) => T): T =>
  useSyncExternalStore(lc.subscribe, () => select(state), () => select(state));

export function grade(id: string, g: Grade, now = Date.now()) {
  lc.update((p) => {
    const k = dayKey(new Date(now));
    return { ...p, cards: { ...p.cards, [id]: review(p.cards[id], g, now, 0.9, false) }, days: { ...p.days, [k]: (p.days[k] ?? 0) + 1 } };
  });
}

export function forget(id: string) {
  lc.update((p) => {
    const cards = { ...p.cards };
    delete cards[id];
    return { ...p, cards };
  });
}

export function passSql(exercise: string) {
  if (state.sql.includes(exercise)) return;
  lc.update((p) => ({ ...p, sql: [...p.sql, exercise] }));
}

export function toggleRead(guide: string) {
  lc.update((p) => ({ ...p, read: p.read.includes(guide) ? p.read.filter((x) => x !== guide) : [...p.read, guide] }));
}

/** Solved problems whose re-solve is due, oldest first. */
export function dueIds(p: LcProgress, now = Date.now()) {
  return Object.entries(p.cards)
    .filter(([, c]) => c.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => id);
}

export const nextNew = (p: LcProgress, order: string[]) => order.find((id) => !p.cards[id]) ?? null;

const time = (c: CardState) => c.last ?? c.seen;
/** Combine two copies: the newest review per problem wins, daily counts take the max, read guides follow the newer copy plus anything read on either side. */
export function mergeLc(local: LcProgress, remote: LcProgress): LcProgress {
  const cards = { ...remote.cards };
  for (const [id, c] of Object.entries(local.cards)) {
    const r = cards[id];
    if (!r || time(c) > time(r) || (time(c) === time(r) && c.reps >= r.reps)) cards[id] = c;
  }
  const days = { ...remote.days };
  for (const [k, v] of Object.entries(local.days)) days[k] = Math.max(v, days[k] ?? 0);
  return { version: 1, cards, days, read: [...new Set([...remote.read, ...local.read])], sql: [...new Set([...(remote.sql ?? []), ...(local.sql ?? [])])] };
}

/** Public summary shown on the leaderboard. */
export interface LcStats {
  solved: number;
  week: number;
  at: number;
}
export function lcStats(p: LcProgress, now = new Date()): LcStats {
  let week = 0;
  const d = new Date(now);
  for (let i = 0; i < 7; i++) {
    week += p.days[dayKey(d)] ?? 0;
    d.setDate(d.getDate() - 1);
  }
  return { solved: Object.keys(p.cards).length, week, at: now.getTime() };
}

/** English interval labels for the LeetCode pages. */
export function intervalEn(ms: number) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${Math.max(1, m)} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h`;
  const days = Math.round(h / 24);
  if (days < 31) return `${days} d`;
  const mo = Math.round(days / 30);
  return mo < 12 ? `${mo} mo` : `${(days / 365).toFixed(1)} y`;
}
