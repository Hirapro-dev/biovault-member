"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ContentUpdateData {
  id: string;
  title: string;
  contentType: string;
  linkUrl: string | null;
  publishedAt: string;
}

export default function UpdateNotification() {
  const [update, setUpdate] = useState<ContentUpdateData | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 未読の更新通知を取得
    fetch("/api/member/content-updates")
      .then((r) => r.json())
      .then((data) => {
        if (data.update) {
          setUpdate(data.update);
          // 少し遅延してフェードイン
          setTimeout(() => setVisible(true), 500);
        }
      })
      .catch(() => {});
  }, []);

  // 閉じる（既読にする）
  const handleClose = async () => {
    setVisible(false);
    if (update) {
      await fetch("/api/member/content-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentUpdateId: update.id }),
      });
    }
  };

  // 「更新情報を見る」クリック（既読にしてリンクへ）
  const handleView = async () => {
    if (update) {
      await fetch("/api/member/content-updates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentUpdateId: update.id }),
      });
    }
  };

  if (!update) return null;

  const formattedDate = new Date(update.publishedAt).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const linkUrl = update.linkUrl || "/dashboard";

  return (
    <>
      {/* オーバーレイ */}
      <div
        className={`fixed inset-0 z-[100] bg-black/60 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* ポップアップ */}
      <div
        className={`fixed z-[101] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[400px] transition-all duration-300 ${
          visible
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div
          className="relative bg-bg-secondary border border-border-gold rounded-xl overflow-hidden"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(201,168,76,0.1)" }}
        >
          {/* 閉じるボタン */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-border-gold transition-all cursor-pointer"
            aria-label="閉じる"
          >
            ✕
          </button>

          {/* 上部装飾ライン */}
          <div
            className="h-1"
            style={{ background: "linear-gradient(90deg, transparent, #BFA04B, #D4B856, #BFA04B, transparent)" }}
          />

          <div className="p-6 sm:p-8 text-center">
            {/* アイコン */}
            <div className="text-3xl mb-3">🔔</div>

            {/* 日付 */}
            <div className="text-[11px] text-text-muted font-mono tracking-wider mb-3">
              {formattedDate}
            </div>

            {/* タイトル */}
            <div className="text-sm sm:text-base text-text-primary leading-relaxed mb-1">
              {update.title}
            </div>
            <div className="text-xs text-text-muted mb-6">
              ぜひご確認ください。
            </div>

            {/* CTAボタン */}
            <Link
              href={linkUrl}
              onClick={handleView}
              className="inline-block w-full"
            >
              <div
                className="relative overflow-hidden rounded-lg py-3.5 px-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(201,168,76,0.3)] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #BFA04B 0%, #D4B856 50%, #BFA04B 100%)",
                  boxShadow: "0 4px 15px rgba(201,168,76,0.25)",
                }}
              >
                <div className="text-bg-primary text-sm font-bold tracking-wider">
                  更新情報を見る
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
