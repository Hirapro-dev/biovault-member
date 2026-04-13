"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

type Step = {
  key: string;
  label: string;
  actor: "admin" | "member";
  done: boolean;
};

export default function TestControlPanel() {
  const router = useRouter();
  const [isTester, setIsTester] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [ipsStatus, setIpsStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  const fetchStatus = useCallback(() => {
    fetch("/api/member/test-control")
      .then((r) => r.json())
      .then((data) => {
        setIsTester(data.isTester);
        if (data.steps) setSteps(data.steps);
        if (data.ipsStatus) setIpsStatus(data.ipsStatus);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (!isTester) return null;

  // 次の未完了ステップ
  const nextStep = steps.find((s) => !s.done);
  const allDone = steps.length > 0 && steps.every((s) => s.done);

  const handleAdminSkip = async () => {
    if (!nextStep) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/member/test-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "admin_skip", stepKey: nextStep.key }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`${nextStep.label} → 完了`);
        router.refresh();
        // Server Componentのキャッシュ更新後にステータスを再取得
        setTimeout(() => fetchStatus(), 500);
      } else {
        setMessage(data.error || "エラー");
      }
    } catch {
      setMessage("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("全ステータスをリセットしますか？\n（最初からやり直せます）")) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/member/test-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      if (res.ok) {
        setMessage("リセット完了。ログアウトします...");
        setTimeout(() => {
          signOut({ callbackUrl: "/login" });
        }, 1000);
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
        className="fixed top-[60px] right-3 z-[40] px-3 py-1.5 bg-status-danger/80 text-white text-[10px] font-bold rounded-full shadow-lg hover:bg-status-danger transition-colors cursor-pointer lg:top-4 lg:right-4 lg:z-[100]"
      >
        TEST
      </button>
    );
  }

  return (
    <>
    {/* オーバーレイ: パネル外タップで閉じる */}
    <div className="fixed inset-0 z-[99]" onClick={() => setOpen(false)} />
    <div className="fixed top-[60px] right-3 z-[100] w-72 bg-bg-secondary border border-status-danger/30 rounded-xl shadow-2xl overflow-hidden lg:top-4 lg:right-4 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-2.5 bg-status-danger/10 border-b border-status-danger/20">
        <span className="text-xs font-bold text-status-danger tracking-wider">TEST MODE</span>
        <button onClick={() => setOpen(false)} className="text-text-muted hover:text-white text-sm cursor-pointer">×</button>
      </div>

      {/* 工程リスト */}
      <div className="p-3 space-y-1">
        {steps.map((step, i) => {
          const isNext = nextStep?.key === step.key;
          return (
            <div key={step.key} className={`flex items-center gap-2 py-1.5 px-2 rounded text-[11px] ${isNext ? "bg-gold/10 border border-gold/20" : ""}`}>
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0 ${
                step.done ? "bg-gold text-bg-primary font-bold" : isNext ? "border-2 border-gold text-gold" : "border border-border text-text-muted"
              }`}>
                {step.done ? "✓" : i + 1}
              </span>
              <span className={`flex-1 ${step.done ? "text-gold" : isNext ? "text-text-primary font-medium" : "text-text-muted"}`}>
                {step.label}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                step.actor === "admin"
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>
                {step.actor === "admin" ? "管理者" : "会員"}
              </span>
            </div>
          );
        })}
      </div>

      {/* 次のアクション */}
      <div className="px-3 pb-3 space-y-2 border-t border-border pt-3">
        {allDone ? (
          <div className="text-center text-xs text-gold py-2">全工程完了</div>
        ) : nextStep ? (
          <>
            <div className="text-[10px] text-text-muted mb-1">
              次: <span className="text-text-primary font-medium">{nextStep.label}</span>
            </div>
            {nextStep.actor === "admin" ? (
              <button
                onClick={handleAdminSkip}
                disabled={loading}
                className="w-full py-2.5 bg-gold-gradient text-bg-primary text-xs font-bold rounded tracking-wider cursor-pointer hover:opacity-90 disabled:opacity-40 transition-all"
              >
                {loading ? "処理中..." : `「${nextStep.label}」をスキップ →`}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded p-2.5">
                  <div className="text-[10px] text-emerald-400 font-medium mb-0.5">会員操作が必要です</div>
                  <div className="text-[10px] text-text-muted">ページ上で実際に操作してください</div>
                </div>
                <button
                  onClick={() => { fetchStatus(); router.refresh(); setMessage("更新しました"); }}
                  className="w-full py-2 border border-border text-text-muted text-[10px] rounded cursor-pointer hover:border-gold hover:text-gold transition-all"
                >
                  操作完了 → ステータスを更新
                </button>
              </div>
            )}
          </>
        ) : null}

        <button
          onClick={handleReset}
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
    </>
  );
}
