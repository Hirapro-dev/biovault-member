"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import CautionContent from "@/components/culture-fluid/CautionContent";

/**
 * 留意事項の同意フォーム（クリニック予約フローから遷移してきた場合に使用）
 *
 * スクロール → チェック → 同意ボタン → API呼び出し → /culture-fluid に戻る
 */
export default function CautionAgreeForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const cautionRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleScroll = () => {
    if (!cautionRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = cautionRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setScrolled(true);
    }
  };

  const handleAgree = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/member/culture-fluid/caution-agree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        router.push("/culture-fluid");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "同意の記録に失敗しました");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        ref={cautionRef}
        onScroll={handleScroll}
        className="max-h-[50vh] overflow-y-auto border border-border rounded p-4 bg-bg-tertiary text-xs sm:text-sm text-text-secondary leading-[2] space-y-4"
      >
        <CautionContent />
      </div>

      {!scrolled && (
        <div className="mt-3 text-center text-xs text-gold animate-pulse">↓ 最後までスクロールしてください</div>
      )}

      <div className={`mt-4 transition-opacity ${scrolled ? "opacity-100" : "opacity-40"}`}>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => scrolled && setAgreed(e.target.checked)}
            disabled={!scrolled}
            className="accent-gold w-5 h-5"
          />
          <span className="text-sm text-text-secondary">
            上記の留意事項を確認し、同意します。
          </span>
        </label>
      </div>

      {error && (
        <div className="mt-3 p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-xs text-center">
          {error}
        </div>
      )}

      <button
        onClick={handleAgree}
        disabled={!agreed || loading}
        className={`w-full mt-4 py-4 rounded text-sm tracking-wider transition-all cursor-pointer ${
          agreed
            ? "hover:opacity-90"
            : "opacity-40 cursor-not-allowed"
        }`}
        style={{
          background: agreed ? "linear-gradient(135deg, #BFA04B, #D4B856)" : undefined,
          color: agreed ? "#070709" : undefined,
        }}
      >
        {loading ? "送信中..." : "同意してクリニック予約へ進む →"}
      </button>
    </div>
  );
}
