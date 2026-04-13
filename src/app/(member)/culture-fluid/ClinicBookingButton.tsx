"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SESSION_OPTIONS = [
  { count: 1, label: "1回分", duration: "約30分" },
  { count: 2, label: "2回分", duration: "約50分" },
  { count: 3, label: "3回分", duration: "約75分" },
] as const;

/**
 * 培養上清液サービス「クリニックの予約をする」ボタン
 *
 * 施術回数（1〜3回分）を選択してから予約申込する。
 * maxSessions で選択可能な上限を制御する（残り回数以下）。
 */
export default function ClinicBookingButton({
  orderId,
  maxSessions,
}: {
  orderId: string;
  maxSessions: number;
}) {
  const router = useRouter();
  const [sessionCount, setSessionCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 選択可能な選択肢（残り回数と最大3回の小さい方）
  const availableOptions = SESSION_OPTIONS.filter(
    (opt) => opt.count <= Math.min(maxSessions, 3)
  );

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/member/culture-fluid/clinic-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, sessionCount }),
      });

      if (res.ok) {
        router.push("/culture-fluid/clinic-booking/thanks");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "申込に失敗しました");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4">
      {/* 施術回数の選択 */}
      <div className="mb-4">
        <div className="text-[11px] text-text-muted mb-2">1回の施術で使用する回数を選択</div>
        <div className="grid grid-cols-1 gap-2">
          {availableOptions.map((opt) => (
            <label
              key={opt.count}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                sessionCount === opt.count
                  ? "border-gold bg-gold/5"
                  : "border-border bg-bg-elevated hover:border-border-gold"
              }`}
            >
              <input
                type="radio"
                name="sessionCount"
                value={opt.count}
                checked={sessionCount === opt.count}
                onChange={() => setSessionCount(opt.count)}
                className="accent-gold w-4 h-4 cursor-pointer"
              />
              <div className="flex-1">
                <span className={`text-sm font-medium ${sessionCount === opt.count ? "text-gold" : "text-text-primary"}`}>
                  {opt.label}
                </span>
              </div>
              <span className={`text-xs font-mono ${sessionCount === opt.count ? "text-gold" : "text-text-muted"}`}>
                施術時間 {opt.duration}
              </span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-xs text-center">
          {error}
        </div>
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full py-3.5 rounded-lg text-sm font-bold tracking-wider transition-all cursor-pointer hover:opacity-90 disabled:opacity-40"
        style={{ background: "linear-gradient(135deg, #BFA04B, #D4B856)", color: "#070709" }}
      >
        {loading ? "送信中..." : `${sessionCount}回分でクリニックの予約をする →`}
      </button>
      <p className="text-[10px] text-text-muted text-center mt-2">
        ※ 申込後、担当スタッフより折り返しご連絡いたします
      </p>
    </div>
  );
}
