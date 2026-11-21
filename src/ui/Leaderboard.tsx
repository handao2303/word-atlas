import { ArrowRight, Crown, Flame, RefreshCw, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAtlas } from "../atlas/context";
import { cloudEnabled, useLeaderboard, type LeaderRow } from "../lib/cloud";
import { metricValue, type Metric as WordMetric } from "../store/stats";

type Metric = WordMetric | "code";

export const METRICS: [Metric, string, string][] = [
  ["week", "Tuần này", "câu"],
  ["mastered", "Đã thuộc", "từ"],
  ["learned", "Đã học", "từ"],
  ["streak", "Chuỗi ngày", "ngày"],
  ["code", "LeetCode", "bài"],
];

const HINT: Record<Metric, string> = {
  week: "Số câu đã trả lời trong 7 ngày qua.",
  mastered: "Số từ nhớ lâu (độ bền trí nhớ trên 21 ngày).",
  learned: "Số từ đã gặp ít nhất một lần.",
  streak: "Số ngày học liên tiếp tính tới hôm nay.",
  code: "Số bài LeetCode đã giải trong lộ trình.",
};

const METRIC_KEY = "word-atlas:rank-metric";

export interface Ranked {
  row: LeaderRow;
  value: number;
  rank: number;
}

/** Sort by the metric; equal values share a rank (1, 2, 2, 4). */
export function rankRows(rows: LeaderRow[], metric: Metric, now = new Date()): Ranked[] {
  const list = rows.map((row) => ({ row, value: metric === "code" ? (row.lc?.solved ?? 0) : metricValue(row.stats, metric, now) }));
  list.sort((a, b) => b.value - a.value || nameOf(a.row).localeCompare(nameOf(b.row)));
  let prev = -1;
  let rank = 0;
  return list.map((x, i) => {
    if (x.value !== prev) rank = i + 1;
    prev = x.value;
    return { ...x, rank };
  });
}

export const nameOf = (r: LeaderRow) => r.email_name || r.display_name || "Bạn học";

function useMetric(): [Metric, (m: Metric) => void] {
  const [metric, setMetric] = useState<Metric>(() => {
    try {
      const v = localStorage.getItem(METRIC_KEY) as Metric | null;
      return v && METRICS.some((m) => m[0] === v) ? v : "week";
    } catch {
      return "week";
    }
  });
  return [
    metric,
    (m) => {
      setMetric(m);
      try {
        localStorage.setItem(METRIC_KEY, m);
      } catch {
        /* private mode */
      }
    },
  ];
}

/** Counts up to the value when it appears or changes. */
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(0);
  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = from.current;
    from.current = value;
    if (reduce || start === value) return setShown(value);
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 700);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(start + (value - start) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{shown.toLocaleString("vi-VN")}</>;
}

function initials(name: string) {
  return name.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2).toUpperCase() || "?";
}

function Avatar({ row, size = 40 }: { row: LeaderRow; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (row.avatar_url && !broken)
    return (
      <img
        className="lb-avatar"
        style={{ width: size, height: size }}
        src={row.avatar_url}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    );
  return (
    <span className="lb-avatar lb-avatar-text" style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden="true">
      {initials(nameOf(row))}
    </span>
  );
}

function Name({ row, me }: { row: LeaderRow; me: string | null }) {
  const sub = row.display_name && row.display_name !== row.email_name ? row.display_name : null;
  return (
    <span className="lb-name">
      <b>{nameOf(row)}</b>
      {row.user_id === me && <em>Bạn</em>}
      {sub && <small>{sub}</small>}
    </span>
  );
}

function Podium({ top, me, unit, metric }: { top: Ranked[]; me: string | null; unit: string; metric: Metric }) {
  // Visual order 2 · 1 · 3 so the winner stands in the middle.
  const order = [top[1], top[0], top[2]].filter(Boolean) as Ranked[];
  return (
    <div className="lb-podium" role="list">
      {order.map((x) => {
        const place = x.value > 0 ? Math.min(x.rank, 3) : 0;
        return (
          <div key={x.row.user_id} role="listitem" className={`lb-step lb-place-${place} ${x.row.user_id === me ? "is-me" : ""}`}>
            <div className="lb-step-top">
              {place === 1 && <Crown className="lb-crown" size={26} aria-label="Hạng 1" />}
              <Avatar row={x.row} size={place === 1 ? 64 : 52} />
              <Name row={x.row} me={me} />
              <span className="lb-step-value">
                {metric === "streak" && x.value > 0 && <Flame size={15} />}
                <b>
                  <CountUp value={x.value} />
                </b>{" "}
                <small>{unit}</small>
              </span>
            </div>
            <div className="lb-plinth">
              <span>{x.rank}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Nudge({ ranked, me, unit }: { ranked: Ranked[]; me: string | null; unit: string }) {
  const i = ranked.findIndex((x) => x.row.user_id === me);
  if (i < 0) return null;
  const mine = ranked[i];
  const ahead = ranked.slice(0, i).reverse().find((x) => x.value > mine.value);
  let text: string;
  if (ranked.length < 2) text = "Mời thêm bạn vào học cùng để bảng xếp hạng sôi động hơn!";
  else if (!ahead && mine.value > 0) text = mine.rank === 1 && ranked.filter((x) => x.rank === 1).length > 1 ? "Bạn đang đồng hạng nhất. Thêm một câu là vượt lên!" : "Bạn đang dẫn đầu. Giữ vững phong độ nhé!";
  else if (!ahead) text = "Trả lời câu đầu tiên hôm nay để lên bảng!";
  else text = `Còn ${(ahead.value - mine.value + 1).toLocaleString("vi-VN")} ${unit} nữa là vượt ${nameOf(ahead.row)} lên hạng ${ahead.rank}.`;
  return (
    <p className="lb-nudge">
      <TrendingUp size={16} /> {text}
    </p>
  );
}

export function Leaderboard({ compact = false }: { compact?: boolean }) {
  const atlas = useAtlas();
  const { rows, error, loading, me, refresh } = useLeaderboard(atlas.id);
  const [metric, setMetric] = useMetric();
  const ranked = useMemo(() => rankRows(rows ?? [], metric), [rows, metric]);
  const unit = METRICS.find((m) => m[0] === metric)![2];

  if (!cloudEnabled) return <p className="muted">Bảng xếp hạng chỉ có trên bản online vì cần đăng nhập.</p>;

  const top = ranked.slice(0, 3);
  let rest = ranked.slice(3);
  if (compact) {
    const mine = rest.find((x) => x.row.user_id === me);
    rest = rest.slice(0, 2);
    if (mine && !rest.includes(mine)) rest.push(mine);
  }
  const max = ranked[0]?.value || 0;

  return (
    <div className={`lb ${compact ? "is-compact" : ""}`}>
      <div className="lb-toolbar">
        <div className="segmented" role="group" aria-label="Xếp theo">
          {METRICS.map(([k, label]) => (
            <button key={k} className={metric === k ? "is-on" : ""} aria-pressed={metric === k} onClick={() => setMetric(k)}>
              {label}
            </button>
          ))}
        </div>
        <button className="icon-btn" onClick={() => void refresh()} disabled={loading} aria-label="Tải lại bảng xếp hạng" title="Tải lại">
          <RefreshCw size={18} className={loading ? "spin" : ""} />
        </button>
      </div>
      {!compact && <p className="muted lb-hint">{HINT[metric]}</p>}

      {error && <p className="warn-text">{error}</p>}
      {rows === null && !error && <p className="muted">Đang tải bảng xếp hạng…</p>}
      {rows !== null && ranked.length === 0 && !error && <p className="muted">Chưa có ai trên bảng.</p>}

      {top.length > 0 && <Podium key={metric} top={top} me={me} unit={unit} metric={metric} />}
      <Nudge ranked={ranked} me={me} unit={unit} />

      {rest.length > 0 && (
        <ol className="lb-list">
          {rest.map(({ row, value, rank }) => (
            <li key={row.user_id} className={`lb-row ${row.user_id === me ? "is-me" : ""}`}>
              <span className="lb-rank">{rank}</span>
              <Avatar row={row} size={36} />
              <Name row={row} me={me} />
              <span className="lb-bar" aria-hidden="true">
                <i style={{ width: `${max && value ? Math.max(4, (value / max) * 100) : 0}%` }} />
              </span>
              <span className="lb-value">
                <b>
                  <CountUp value={value} />
                </b>{" "}
                <small>{unit}</small>
              </span>
            </li>
          ))}
        </ol>
      )}

      {compact && (
        <a className="link lb-more" href="#/rank">
          Xem bảng xếp hạng đầy đủ <ArrowRight size={15} />
        </a>
      )}
    </div>
  );
}
