import { Leaderboard } from "../ui/Leaderboard";

export function Rank() {
  return (
    <div className="page rank">
      <header className="page-head">
        <p className="eyebrow">Xếp hạng</p>
        <h1 className="display">Ai chăm nhất tuần này?</h1>
        <p className="lede">Mọi người trong nhóm đều thấy bảng này. Chỉ các con số tổng được chia sẻ, danh sách từ của bạn vẫn là riêng tư.</p>
      </header>
      <section className="panel">
        <Leaderboard />
      </section>
    </div>
  );
}
