import { LogOut, RefreshCw } from "lucide-react";
import { cloudEnabled, pushNow, signOut, useCloud, type SyncStatus } from "../lib/cloud";

const LABEL: Record<SyncStatus, string> = {
  idle: "Chưa đồng bộ",
  syncing: "Đang đồng bộ…",
  synced: "Đã đồng bộ",
  offline: "Đang offline, sẽ đồng bộ khi có mạng",
  error: "Đồng bộ lỗi, thử lại sau",
};

export function CloudAccount() {
  const { session, status, lastSync } = useCloud();
  if (!cloudEnabled || !session) return null;
  return (
    <div className="cloud-account">
      <p className="muted">
        Đăng nhập: <b>{session.user.email}</b> · {LABEL[status]}
        {status === "synced" && lastSync ? ` lúc ${new Date(lastSync).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}` : ""}
      </p>
      <div className="row">
        <button className="btn" onClick={() => void pushNow()}>
          <RefreshCw size={18} /> Đồng bộ ngay
        </button>
        <button className="btn" onClick={() => void signOut()}>
          <LogOut size={18} /> Đăng xuất
        </button>
      </div>
    </div>
  );
}
