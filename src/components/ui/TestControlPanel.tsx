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

type StatusData = {
  isTester: boolean;
  ipsSteps?: Step[];
  cfSteps?: Step[];
  currentStepIndex?: number;
  cfCurrentStepIndex?: number;
};

export default function TestControlPanel() {
  const router = useRouter();
  const [data, setData] = useState<StatusData>({ isTester: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"ips" | "cf">("ips");

  const fetchStatus = useCallback(() => {
    fetch("/api/member/test-control")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  if (!data.isTester) return null;

  const steps = tab === "ips" ? (data.ipsSteps || []) : (data.cfSteps || []);
  const nextStep = steps.find((s) => !s.done);
  const lastDoneIndex = steps.map((s, i) => s.done ? i : -1).filter(i => i >= 0).pop() ?? -1;
  const allDone = steps.length > 0 && steps.every((s) => s.done);

  const handleAction = async (action: string, extra?: Record<string, string>) => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/member/test-control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, flow: tab, ...extra }),
      });
      const d = await res.json();
      if (res.ok) {
        if (action === "reset") {
          setMessage("リセット完了。ログアウトします...");
          setTimeout(() => signOut({ callbackUrl: "/login" }), 1000);
          return;
        }
        if (action === "reset_full") {
          setMessage("削除完了。申込フォームへ移動します...");
          setTimeout(() => signOut({ callbackUrl: "/form/app" }), 1000);
          return;
        }
        setMessage(d.message || "完了");
        router.refresh();
        setTimeout(() => fetchStatus(), 500);
      } else {
        setMessage(d.error || "エラー");
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
        className="fixed top-[60px] right-3 z-[9999] px-3 py-1.5 bg-status-danger/80 text-white text-[10px] font-bold rounded-full shadow-lg hover:bg-status-danger transition-colors cursor-pointer lg:top-4 lg:right-4"
      >
        TEST
      </button>
    );
  }

  return (
    <>
    <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
    <div className="fixed top-[60px] right-3 z-[9999] w-72 bg-bg-secondary border border-status-danger/30 rounded-xl shadow-2xl overflow-hidden lg:top-4 lg:right-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-2 bg-status-danger/10 border-b border-status-danger/20">
        <span className="text-[10px] font-bold text-status-danger tracking-wider">TEST MODE</span>
        <button onClick={() => setOpen(false)} className="text-text-muted hover:text-white text-sm cursor-pointer">×</button>
      </div>

      {/* タブ */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("ips")}
          className={`flex-1 py-2 text-[10px] font-medium tracking-wider cursor-pointer transition-colors ${tab === "ips" ? "text-gold border-b-2 border-gold" : "text-text-muted hover:text-text-primary"}`}
        >
          iPS作製・保管
        </button>
        <button
          onClick={() => setTab("cf")}
          className={`flex-1 py-2 text-[10px] font-medium tracking-wider cursor-pointer transition-colors ${tab === "cf" ? "text-gold border-b-2 border-gold" : "text-text-muted hover:text-text-primary"}`}
        >
          培養上清液
        </button>
      </div>

      {/* 次のステップ */}
      <div className="p-3 space-y-2">
        {allDone ? (
          <div className="text-center text-xs text-gold py-3">全工程完了</div>
        ) : nextStep ? (
          <>
            <div className="text-[10px] text-text-muted">
              Step {steps.indexOf(nextStep) + 1} / {steps.length}
            </div>
            <div className="text-sm text-text-primary font-medium">{nextStep.label}</div>
            <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block ${
              nextStep.actor === "admin"
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            }`}>
              {nextStep.actor === "admin" ? "管理者操作" : "会員操作"}
            </div>

            {nextStep.actor === "admin" ? (
              <button
                onClick={() => handleAction("admin_skip", { stepKey: nextStep.key })}
                disabled={loading}
                className="w-full py-3 bg-gold-gradient text-bg-primary text-xs font-bold rounded tracking-wider cursor-pointer hover:opacity-90 disabled:opacity-40 transition-all"
              >
                {loading ? "処理中..." : "スキップして次へ →"}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded p-2.5">
                  <div className="text-[10px] text-emerald-400 font-medium">ページ上で実際に操作してください</div>
                </div>
                <button
                  onClick={() => { fetchStatus(); router.refresh(); setMessage("更新しました"); }}
                  className="w-full py-2 border border-border text-text-muted text-[10px] rounded cursor-pointer hover:border-gold hover:text-gold transition-all"
                >
                  操作完了 → 更新
                </button>
              </div>
            )}
          </>
        ) : null}

        {/* 1つ戻る */}
        {lastDoneIndex >= 0 && (
          <button
            onClick={() => handleAction("back")}
            disabled={loading}
            className="w-full py-2 border border-border text-text-muted text-[10px] rounded cursor-pointer hover:border-gold hover:text-gold disabled:opacity-40 transition-all"
          >
            ← 1つ前のステップに戻す
          </button>
        )}

        {/* リセット */}
        <button
          onClick={() => {
            if (confirm("全ステータスをリセットしますか？")) handleAction("reset");
          }}
          disabled={loading}
          className="w-full py-2 border border-status-danger/30 text-status-danger text-[10px] rounded cursor-pointer hover:bg-status-danger/10 disabled:opacity-40 transition-all"
        >
          工程をリセット
        </button>

        {/* フォームからやり直す */}
        <button
          onClick={() => {
            if (confirm("アカウントを削除して申込フォームからやり直しますか？\n（現在のアカウントは完全に削除されます）")) {
              handleAction("reset_full");
            }
          }}
          disabled={loading}
          className="w-full py-2 border border-status-danger/30 text-status-danger/60 text-[10px] rounded cursor-pointer hover:bg-status-danger/10 disabled:opacity-40 transition-all"
        >
          申込フォームからやり直す
        </button>

        {message && (
          <div className="text-[10px] text-text-muted text-center py-1">{message}</div>
        )}
      </div>
    </div>
    </>
  );
}
