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
        className="fixed top-[60px] right-3 z-[9999] px-5 py-2.5 bg-red-500 text-white text-xs font-bold rounded-full shadow-[0_4px_20px_rgba(239,68,68,0.5)] hover:bg-red-400 active:scale-95 transition-all cursor-pointer lg:top-4 lg:right-4"
      >
        TEST
      </button>
    );
  }

  return (
    <>
    <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
    <div className="fixed top-[60px] right-3 z-[9999] w-80 bg-[#1a1a22] border border-red-500/40 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden lg:top-4 lg:right-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3 bg-red-500/15 border-b border-red-500/30">
        <span className="text-xs font-bold text-red-400 tracking-wider">TEST MODE</span>
        <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white text-sm cursor-pointer transition-colors">×</button>
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
      <div className="p-4 space-y-3">
        {allDone ? (
          <div className="text-center text-sm text-gold py-4 font-medium">全工程完了</div>
        ) : nextStep ? (
          <>
            <div className="text-xs text-white/40 font-mono">
              Step {steps.indexOf(nextStep) + 1} / {steps.length}
            </div>
            <div className="text-base text-white font-medium leading-snug">{nextStep.label}</div>
            <div className={`text-[11px] px-2.5 py-1 rounded-full inline-block font-medium ${
              nextStep.actor === "admin"
                ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
            }`}>
              {nextStep.actor === "admin" ? "管理者操作" : "会員操作"}
            </div>

            {nextStep.actor === "admin" ? (
              <button
                onClick={() => handleAction("admin_skip", { stepKey: nextStep.key })}
                disabled={loading}
                className="w-full py-3.5 bg-gold-gradient text-bg-primary text-sm font-bold rounded-lg tracking-wider cursor-pointer hover:opacity-90 active:scale-[0.98] disabled:opacity-40 transition-all"
              >
                {loading ? "処理中..." : "スキップして次へ →"}
              </button>
            ) : (
              <div className="space-y-2.5">
                <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-lg p-3">
                  <div className="text-xs text-emerald-300 font-medium">ページ上で実際に操作してください</div>
                </div>
                <button
                  onClick={() => { fetchStatus(); router.refresh(); setMessage("更新しました"); }}
                  className="w-full py-3 border border-white/20 text-white/70 text-xs rounded-lg cursor-pointer hover:border-gold hover:text-gold active:scale-[0.98] transition-all"
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
            className="w-full py-3 border border-white/15 text-white/50 text-xs rounded-lg cursor-pointer hover:border-gold hover:text-gold active:scale-[0.98] disabled:opacity-40 transition-all"
          >
            ← 1つ前に戻す
          </button>
        )}

        <div className="border-t border-white/10 pt-3 space-y-2">
          {/* リセット */}
          <button
            onClick={() => { if (confirm("全ステータスをリセットしますか？")) handleAction("reset"); }}
            disabled={loading}
            className="w-full py-2.5 border border-red-500/30 text-red-400 text-xs rounded-lg cursor-pointer hover:bg-red-500/10 active:scale-[0.98] disabled:opacity-40 transition-all"
          >
            工程をリセット
          </button>

          {/* フォームからやり直す */}
          <button
            onClick={() => { if (confirm("アカウントを削除して申込フォームからやり直しますか？")) handleAction("reset_full"); }}
            disabled={loading}
            className="w-full py-2.5 border border-red-500/20 text-red-400/60 text-xs rounded-lg cursor-pointer hover:bg-red-500/10 active:scale-[0.98] disabled:opacity-40 transition-all"
          >
            申込フォームからやり直す
          </button>
        </div>

        {message && (
          <div className="text-xs text-white/50 text-center py-1">{message}</div>
        )}
      </div>
    </div>
    </>
  );
}
