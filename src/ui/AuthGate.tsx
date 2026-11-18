import { ArrowRight, Mail } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cloudEnabled, sendLoginLink, useCloud } from "../lib/cloud";
import { Logo } from "./Logo";

/** When cloud login is configured, nothing renders until the user is signed in. */
export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, session } = useCloud();
  if (!cloudEnabled) return <>{children}</>;
  if (!ready)
    return (
      <div className="boot" aria-busy="true">
        <Logo />
        <span className="spinner" />
      </div>
    );
  if (!session) return <Login />;
  return <>{children}</>;
}

function Login() {
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem("word-atlas:last-email") ?? "";
    } catch {
      return "";
    }
  });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(v)) return setError("Email chưa đúng định dạng.");
    setError(null);
    setState("sending");
    const r = await sendLoginLink(v);
    if (r.error) {
      setError(r.error);
      setState("idle");
      return;
    }
    try {
      localStorage.setItem("word-atlas:last-email", v);
    } catch {
      /* private mode */
    }
    setState("sent");
  };

  return (
    <div className="boot login">
      <Logo />
      {state === "sent" ? (
        <div className="login-card" role="status">
          <Mail size={28} />
          <h1>Kiểm tra email của bạn</h1>
          <p className="muted">
            Đã gửi link đăng nhập tới <b>{email}</b>. Mở email trên thiết bị này và bấm vào link là vào được. Không thấy thì xem thư mục Spam.
          </p>
          <button className="btn" onClick={() => setState("idle")}>
            Gửi lại / đổi email
          </button>
        </div>
      ) : (
        <form className="login-card" onSubmit={submit}>
          <h1>Đăng nhập</h1>
          <p className="muted">Nhập email để nhận link đăng nhập. Tiến độ học sẽ đồng bộ giữa điện thoại và máy tính.</p>
          <input
            className="login-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="email@cuaban.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
          {error && <p className="warn-text">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={state === "sending"}>
            {state === "sending" ? "Đang gửi…" : "Gửi link đăng nhập"} <ArrowRight size={18} />
          </button>
        </form>
      )}
    </div>
  );
}
