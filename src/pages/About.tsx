import { ArrowUpRight, Database, Github, Heart } from "lucide-react";
import { useAtlas } from "../atlas/context";
import { REPO_URL } from "../config";

const BASE = import.meta.env.BASE_URL;

export function About() {
  const atlas = useAtlas();
  return (
    <div className="page about">
      <header className="about-hero">
        <img src={`${BASE}brand/og.webp`} alt="" />
        <div>
          <p className="eyebrow">Giới thiệu</p>
          <h1 className="display">Mỗi từ một bức tranh.</h1>
          <p className="lede">
            Word Atlas gom {atlas.count.toLocaleString()} từ vựng IELTS. Mỗi từ có một bức tranh riêng, một câu ví dụ đời thường, một câu ví dụ ngữ cảnh IELTS, kèm phát âm Anh – Mỹ, cụm từ hay gặp và mẹo phân biệt. Thuộc một từ là thắp sáng một ngôi sao trên bản đồ của bạn.
          </p>
          <p className="lede">Miễn phí, mã nguồn mở, không cần đăng ký. Đây là bản Việt hoá của dự án 词光 · Word Atlas (@designfuchen); code theo giấy phép MIT, dữ liệu theo CC BY 4.0.</p>
          <div className="about-actions">
            <a className="btn btn-primary" href={REPO_URL} target="_blank" rel="noreferrer">
              <Github size={18} /> Xem dự án gốc trên GitHub
            </a>
            <a className="btn btn-ghost" href={`${REPO_URL}/tree/main/data`} target="_blank" rel="noreferrer">
              <Database size={18} /> Tải bộ từ JSON / CSV
            </a>
          </div>
        </div>
      </header>

      <div className="about-grid">
        <section className="panel">
          <h3 className="eyebrow">Vì sao nhớ lâu</h3>
          <ul className="feature-list">
            <li>
              <b>Nhìn trước.</b> Mỗi từ có một bức tranh vẽ đúng cảnh trong câu ví dụ đầu tiên.
            </li>
            <li>
              <b>Rồi tự nhớ lại.</b> Chọn nghĩa, nhìn tranh điền câu, nghe chọn từ, đánh vần: từ nhận ra đến viết được.
            </li>
            <li>
              <b>Gặp lại đúng lúc sắp quên.</b> FSRS là thuật toán ghi nhớ mà Anki bản mới dùng, chỉ xếp lịch ôn khi bạn sắp quên.
            </li>
            <li>
              <b>Điểm trung thực.</b> Chỉ tính lần trả lời đầu tiên. Từ sai sẽ quay lại với dạng câu hỏi khác nhưng không làm tăng tỉ lệ đúng.
            </li>
            <li>
              <b>Tiến độ là của riêng bạn.</b> Không tài khoản, không máy chủ: dữ liệu nằm trong trình duyệt, xuất ra lúc nào cũng được.
            </li>
          </ul>
        </section>

        <section className="panel">
          <h3 className="eyebrow">Phím tắt</h3>
          <dl className="keys">
            <div>
              <dt>
                <kbd>⌘</kbd>
                <kbd>K</kbd> hoặc <kbd>/</kbd>
              </dt>
              <dd>Tìm bất kỳ từ nào</dd>
            </div>
            <div>
              <dt>
                <kbd>1</kbd>–<kbd>4</kbd>
              </dt>
              <dd>Chọn đáp án</dd>
            </div>
            <div>
              <dt>
                <kbd>Enter</kbd>
              </dt>
              <dd>Xác nhận / tiếp tục</dd>
            </div>
            <div>
              <dt>
                <kbd>←</kbd> <kbd>→</kbd>
              </dt>
              <dd>Chuyển từ trước / từ sau trong thẻ từ</dd>
            </div>
            <div>
              <dt>
                <kbd>Esc</kbd>
              </dt>
              <dd>Đóng cửa sổ</dd>
            </div>
          </dl>
        </section>

        <section className="panel">
          <h3 className="eyebrow">Nội dung từ đâu ra</h3>
          <p className="muted">
            Định nghĩa, câu ví dụ, cụm từ và mẹo do mô hình ngôn ngữ lớn viết theo một chuẩn từ điển chung; tranh do mô hình tạo ảnh vẽ cùng một phong cách; phát âm do ElevenLabs tổng hợp (giọng Anh Alice, giọng Mỹ Sarah). Nghĩa tiếng Việt cũng do AI dịch. Mọi nội dung đều được kiểm tra tự động nhưng chưa được người duyệt từng mục, nên có thể có chỗ sai.
          </p>
          <p className="muted">Đây không phải danh sách từ chính thức của IELTS và không hứa hẹn tăng điểm. Nó chỉ muốn việc học từ đẹp hơn và chắc hơn một chút.</p>
        </section>

        <section className="panel">
          <h3 className="eyebrow">Cho lập trình viên</h3>
          <p className="muted">
            <code>data/word-atlas.json</code> và <code>.csv</code> là toàn bộ bộ từ; <code>public/atlas</code> chứa dữ liệu chia nhỏ cho web, tranh và audio. Có thể dùng làm bộ thẻ Anki, app học từ, tiện ích trình duyệt…, chỉ cần ghi nguồn.
          </p>
          <a className="link" href={`${REPO_URL}#readme`} target="_blank" rel="noreferrer">
            Đọc tài liệu <ArrowUpRight size={14} />
          </a>
        </section>
      </div>
      <p className="colophon">
        <Heart size={14} /> Dành cho mọi người đang học từ vựng.
      </p>
    </div>
  );
}
