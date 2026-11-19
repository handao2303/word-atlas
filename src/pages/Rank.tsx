import { Flame, RefreshCw, Trophy } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAtlas } from "../atlas/context";
import { cloudEnabled, fetchLeaderboard, useCloud, type LeaderRow } from "../lib/cloud";
import { metricValue, type Metric } from "../store/stats";

const METRICS: [Metric, string, string][] = [
  ["week", "Tuần này", "câu"],
  ["mastered", "Đã thuộc", "từ"],
  ["learned", "Đã học", "từ"],
  ["streak", "Chuỗi ngày", "ngày"],
];

const HINT: Record<Metric, string> = {
  week: "Số câu đã trả lời trong 7 ngày qua.",
  mastered: "Số từ nhớ lâu (độ bền trí nhớ trên 21 ngày).",
  learned: "Số từ đã gặp ít nhất một lần.",
  streak: "Số ngày học liên tiếp tính tới hôm nay.",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts.at(-1)?.[0] ?? "?") + (parts.length > 1 ? (parts[0][0] ?? "") : "")).toUpperCase();
}

function Avatar({ row }: { row: LeaderRow }) {
  const [broken, setBroken] = useState(false);
  const name = row.display_name || "Bạn học";
  if (row.avatar_url && !broken)
    return <img className="rank-avatar" src={row.avatar_url} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} />;
  return (
    <span className="rank-avatar rank-avatar-text" aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function Rank() {
  const atlas = useAtlas();
  const { session, lastSync } = useCloud();
  const me = session?.user.id;
  const [metric, setMetric] = useState<Metric>(() => {
    try {
      return (localStorage.getItem("word-atlas:rank-metric") as Metric) || "week";
    } catch {
      return "week";
    }
  });
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (push = false) => {
    setLoading(true);
    const r = await fetchLeaderboard(atlas.id, push);
    setRows(r.rows);
    setError(r.error);
    setLoading(false);
  }, [atlas.id]);

  // Reload whenever our own summary reaches the server (first sync after opening, later edits).
  useEffect(() => {
    if (cloudEnabled) void load();
  }, [load, lastSync]);

  useEffect(() => {
    try {
      localStorage.setItem("word-atlas:rank-metric", metric);
    } catch {
      /* private mode */
    }
  }, [metric]);

  const ranked = useMemo(() => {
    const now = new Date();
    const list = (rows ?? []).map((r) => ({ row: r, value: metricValue(r.stats, metric, now) }));
    list.sort((a, b) => b.value - a.value || (a.row.display_name ?? "").localeCompare(b.row.display_name ?? ""));
    // Equal values share a rank (1, 2, 2, 4).
    let prev = -1;
    let rank = 0;
    return list.map((x, i) => {
      if (x.value !== prev) rank = i + 1;
      prev = x.value;
      return { ...x, rank };
    });
  }, [rows, metric]);

  const unit = METRICS.find((m) => m[0] === metric)![2];
  const top = ranked[0]?.value ?? 0;

  return (
    <div className="page rank">
      <header className="page-head">
        <p className="eyebrow">Xếp hạng</p>
        <h1 className="display">Ai chăm nhất tuần này?</h1>
        <p className="lede">Mọi người trong nhóm đều thấy bảng này. Chỉ số tổng được chia sẻ, danh sách từ của bạn vẫn là riêng tư.</p>
      </header>

      {!cloudEnabled ? (
        <section className="panel">
          <p className="muted">Bảng xếp hạng chỉ có trên bản online (word-atlas-vi.vercel.app) vì cần đăng nhập.</p>
        </section>
      ) : (
        <section className="panel rank-panel">
          <div className="rank-toolbar">
            <div className="segmented" role="group" aria-label="Xếp theo">
              {METRICS.map(([k, label]) => (
                <button key={k} className={metric === k ? "is-on" : ""} aria-pressed={metric === k} onClick={() => setMetric(k)}>
                  {label}
                </button>
              ))}
            </div>
            <button className="icon-btn" onClick={() => void load(true)} disabled={loading} aria-label="Tải lại bảng xếp hạng" title="Tải lại">
              <RefreshCw size={18} className={loading ? "spin" : ""} />
            </button>
          </div>
          <p className="muted rank-hint">{HINT[metric]}</p>

          {error && <p className="warn-text">{error}</p>}
          {rows === null && !error && <p className="muted">Đang tải…</p>}
          {rows !== null && ranked.length === 0 && !error && <p className="muted">Chưa có ai trên bảng. Học vài từ để mở màn nhé!</p>}

          <ol className="rank-list">
            {ranked.map(({ row, value, rank }) => (
              <li key={row.user_id} className={`rank-row ${row.user_id === me ? "is-me" : ""} ${rank <= 3 && value > 0 ? `is-top is-top-${rank}` : ""}`}>
                <span className="rank-no">{rank <= 3 && value > 0 ? <Trophy size={18} /> : rank}</span>
                <Avatar row={row} />
                <span className="rank-name">
                  {row.display_name || "Bạn học"}
                  {row.user_id === me && <small> · Bạn</small>}
                </span>
                <span className="rank-bar" aria-hidden="true">
                  <i style={{ width: `${top && value ? Math.max(4, (value / top) * 100) : 0}%` }} />
                </span>
                <span className="rank-value">
                  {metric === "streak" && value > 0 && <Flame size={15} />}
                  <b>{value.toLocaleString("vi-VN")}</b> <small>{unit}</small>
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
