"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 培養上清液サービス「クリニックの予約をする」ボタン
 *
 * ボタン押下 → API呼び出し → サンクスページに遷移
 */
export default function ClinicBookingButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/member/culture-fluid/clinic-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
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
        {loading ? "送信中..." : "クリニックの予約をする →"}
      </button>
      <p className="text-[10px] text-text-muted text-center mt-2">
        ※ 申込後、担当スタッフより折り返しご連絡いたします
      </p>
    </div>
  );
}
