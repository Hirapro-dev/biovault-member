"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const IPS_STATUS_LABELS: Record<string, string> = {
  REGISTERED: "メンバー登録済み",
  TERMS_AGREED: "iPS細胞作製適合確認完了",
  SERVICE_APPLIED: "iPSサービス申込済み",
  SCHEDULE_ARRANGED: "日程調整",
  BLOOD_COLLECTED: "問診・採血",
  IPS_CREATING: "iPS細胞作製中",
  STORAGE_ACTIVE: "iPS細胞保管中",
};

export default function TestControlPanel() {
  const router = useRouter();
  const [isTester, setIsTester] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/member/test-control")
      .then((r) => r.json())
      .then((data) => setIsTester(data.isTester))
      .catch(() => {});
  }, []);

  if (!isTester) return null;

  const handleAction = async (action: "next" | "reset") => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/member/test-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        if (action === "next") {
          const fromLabel = IPS_STATUS_LABELS[data.from] || data.from;
          const toLabel = IPS_STATUS_LABELS[data.to] || data.to;
          setMessage(`${fromLabel} → ${toLabel}`);
        } else {
          setMessage("リセット完了");
        }
        router.refresh();
      } else {
        setMessage(data.error || "エラー");
      }
    } catch {
      setMessage("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 right-3 z-[100] px-3 py-1.5 bg-status-danger/80 text-white text-[10px] font-bold rounded-full shadow-lg hover:bg-status-danger transition-colors cursor-pointer lg:top-4 lg:right-4"
      >
        TEST
      </button>
    );
  }

  return (
    <div className="fixed top-3 right-3 z-[100] w-64 bg-bg-secondary border border-status-danger/30 rounded-xl shadow-2xl overflow-hidden lg:top-4 lg:right-4">
      <div className="flex items-center justify-between px-4 py-2.5 bg-status-danger/10 border-b border-status-danger/20">
        <span className="text-xs font-bold text-status-danger tracking-wider">TEST MODE</span>
        <button
          onClick={() => setOpen(false)}
          className="text-text-muted hover:text-white text-sm cursor-pointer"
        >
          ×
        </button>
      </div>
      <div className="p-3 space-y-2">
        <button
          onClick={() => handleAction("next")}
          disabled={loading}
          className="w-full py-2.5 bg-gold-gradient text-bg-primary text-xs font-bold rounded tracking-wider cursor-pointer hover:opacity-90 disabled:opacity-40 transition-all"
        >
          {loading ? "処理中..." : "次のステップへ進む →"}
        </button>
        <button
          onClick={() => {
            if (confirm("全ステータスをリセットしますか？\n（最初からやり直せます）")) {
              handleAction("reset");
            }
          }}
          disabled={loading}
          className="w-full py-2 border border-status-danger/30 text-status-danger text-xs rounded cursor-pointer hover:bg-status-danger/10 disabled:opacity-40 transition-all"
        >
          工程をリセット
        </button>
        {message && (
          <div className="text-[10px] text-text-muted text-center py-1">{message}</div>
        )}
      </div>
    </div>
  );
}
