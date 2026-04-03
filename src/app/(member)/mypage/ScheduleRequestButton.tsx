"use client";

import { useState } from "react";

export default function ScheduleRequestButton() {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleRequest = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/member/schedule-request", { method: "POST" });
      if (!res.ok) throw new Error();
      setState("done");
    } catch {
      setState("error");
    }
  };

  // 申請済み
  if (state === "done") {
    return (
      <div className="mt-5 bg-bg-secondary border border-border-gold rounded-md p-5 sm:p-6 text-center">
        <div className="text-2xl mb-2">✅</div>
        <div className="text-gold text-sm font-medium mb-1">
          日程調整のリクエストを送信しました
        </div>
        <div className="text-xs text-text-muted leading-relaxed">
          担当者より改めてご連絡させていただきます。<br />
          今しばらくお待ちください。
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 group">
      <button
        onClick={handleRequest}
        disabled={state === "loading"}
        className="relative w-full overflow-hidden rounded-lg p-5 sm:p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(201,168,76,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none border-0"
        style={{
          background: "linear-gradient(135deg, #BFA04B 0%, #D4B856 50%, #BFA04B 100%)",
          boxShadow: "0 4px 15px rgba(201,168,76,0.25)",
        }}
      >
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
        <div className="relative flex items-center justify-between">
          <div className="text-left">
            <div className="text-bg-primary text-sm sm:text-base font-bold tracking-wider mb-1">
              {state === "loading" ? "送信中..." : "日程調整を行う"}
            </div>
            <div className="text-bg-primary/60 text-xs">
              問診・採血の日程を調整いたします
            </div>
          </div>
          <div className="shrink-0 w-10 h-10 rounded-full bg-bg-primary/20 flex items-center justify-center ml-4 group-hover:translate-x-1 transition-transform duration-300">
            <span className="text-bg-primary text-lg">→</span>
          </div>
        </div>
      </button>
      {state === "error" && (
        <div className="mt-2 text-center text-xs text-status-danger">
          送信に失敗しました。もう一度お試しください。
        </div>
      )}
    </div>
  );
}
