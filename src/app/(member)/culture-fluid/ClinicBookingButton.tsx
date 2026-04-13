"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import CautionContent from "@/components/culture-fluid/CautionContent";

const SESSION_OPTIONS = [
  { count: 1, label: "1回分", duration: "約30分" },
  { count: 2, label: "2回分", duration: "約50分" },
  { count: 3, label: "3回分", duration: "約75分" },
] as const;

/**
 * 培養上清液サービス「クリニックの予約をする」ボタン
 *
 * needsCautionAgree=true の場合、まず留意事項への同意ステップを表示し、
 * 同意完了後に施術回数選択 → クリニック予約の流れに進む。
 */
export default function ClinicBookingButton({
  orderId,
  maxSessions,
  needsCautionAgree = false,
}: {
  orderId: string;
  maxSessions: number;
  needsCautionAgree?: boolean;
}) {
  const router = useRouter();
  const [sessionCount, setSessionCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 留意事項同意ステップ
  const [cautionStep, setCautionStep] = useState(needsCautionAgree);
  const cautionRef = useRef<HTMLDivElement>(null);
  const [cautionScrolled, setCautionScrolled] = useState(false);
  const [cautionAgreed, setCautionAgreed] = useState(false);
  const [cautionLoading, setCautionLoading] = useState(false);

  // 選択可能な選択肢（残り回数と最大3回の小さい方）
  const availableOptions = SESSION_OPTIONS.filter(
    (opt) => opt.count <= Math.min(maxSessions, 3)
  );

  const handleCautionScroll = () => {
    if (!cautionRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = cautionRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setCautionScrolled(true);
    }
  };

  const handleCautionAgree = async () => {
    setCautionLoading(true);
    setError("");
    try {
      const res = await fetch("/api/member/culture-fluid/caution-agree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        setCautionStep(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "同意の記録に失敗しました");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setCautionLoading(false);
    }
  };

  const handleBooking = async () => {
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

  // ── 留意事項同意ステップ ──
  if (cautionStep) {
    return (
      <div className="mt-4">
        <div className="rounded-xl border border-status-warning/30 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(251,191,36,0.02) 100%)" }}>
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📋</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-warning/15 text-status-warning border border-status-warning/20">要同意</span>
            </div>
            <div className="text-sm text-text-primary font-medium mb-1">iPS培養上清液に関する留意事項</div>
            <p className="text-xs text-text-muted mb-3">クリニック予約の前に、以下の留意事項をお読みいただき同意してください。</p>

            <div
              ref={cautionRef}
              onScroll={handleCautionScroll}
              className="max-h-[40vh] overflow-y-auto border border-border rounded p-3 bg-bg-tertiary text-xs text-text-secondary leading-[2] space-y-3"
            >
              <CautionContent />
            </div>

            {!cautionScrolled && (
              <div className="mt-2 text-center text-xs text-gold animate-pulse">↓ 最後までスクロールしてください</div>
            )}

            <div className={`mt-3 transition-opacity ${cautionScrolled ? "opacity-100" : "opacity-40"}`}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cautionAgreed}
                  onChange={(e) => cautionScrolled && setCautionAgreed(e.target.checked)}
                  disabled={!cautionScrolled}
                  className="accent-gold w-4 h-4"
                />
                <span className="text-xs text-text-secondary">上記の留意事項を確認し、同意します。</span>
              </label>
            </div>

            {error && (
              <div className="mt-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-xs text-center">
                {error}
              </div>
            )}

            <button
              onClick={handleCautionAgree}
              disabled={!cautionAgreed || cautionLoading}
              className="w-full mt-3 py-3 rounded-lg text-sm font-bold tracking-wider transition-all cursor-pointer hover:opacity-90 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #BFA04B, #D4B856)", color: "#070709" }}
            >
              {cautionLoading ? "送信中..." : "同意してクリニック予約へ進む →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── クリニック予約（回数選択） ──
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
        onClick={handleBooking}
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
