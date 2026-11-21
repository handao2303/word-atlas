/** LeetCode study track: index + English write-ups copied unmodified from azl397985856/leetcode. */
export type Level = "Easy" | "Medium" | "Hard";

export interface LcProblem {
  id: string;
  num: number | null;
  title: string;
  level: Level;
  tags: string[];
  url: string;
  src: string;
  premium?: boolean;
}
export interface LcGuide {
  id: string;
  title: string;
  src: string;
  words: number;
}
export interface LcTrack {
  id: string;
  title: string;
  blurb: string;
  guides: string[];
  problems: string[];
}
export interface LcIndex {
  source: { repo: string; commit: string; author: string; license: string; licenseUrl: string };
  tracks: LcTrack[];
  problems: Record<string, LcProblem>;
  guides: Record<string, LcGuide>;
  /** Source path in the upstream repo -> in-app doc ref ("p/1", "g/tree"). */
  files: Record<string, string>;
  /** Problems in study order (track by track). */
  order: string[];
}

const BASE = `${import.meta.env.BASE_URL}leetcode`;
let indexP: Promise<LcIndex> | null = null;

export function loadLcIndex(): Promise<LcIndex> {
  indexP ??= fetch(`${BASE}/index.json`)
    .then((r) => {
      if (!r.ok) throw new Error(`LeetCode index: HTTP ${r.status}`);
      return r.json() as Promise<Omit<LcIndex, "order">>;
    })
    .then((ix) => ({ ...ix, order: ix.tracks.flatMap((t) => t.problems) }))
    .catch((e) => {
      indexP = null;
      throw e;
    });
  return indexP;
}

const docs = new Map<string, Promise<string>>();
/** ref is "p/<id>" or "g/<id>". */
export function loadLcDoc(ref: string): Promise<string> {
  let p = docs.get(ref);
  if (!p) {
    const [kind, id] = ref.split("/");
    p = fetch(`${BASE}/docs/${kind}-${encodeURIComponent(id)}.md`).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    });
    p.catch(() => docs.delete(ref));
    docs.set(ref, p);
  }
  return p;
}

export function trackOf(ix: LcIndex, ref: string) {
  const [kind, id] = ref.split("/");
  return ix.tracks.find((t) => (kind === "p" ? t.problems : t.guides).includes(id));
}
