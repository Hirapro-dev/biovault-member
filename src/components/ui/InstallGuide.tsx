"use client";

import { useState, useEffect } from "react";

/**
 * iOS / Android向けのホーム画面追加ガイドバナー
 * - PWAとして起動していない場合のみ表示
 * - 一度閉じたら30日間非表示
 */
export default function InstallGuide() {
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    // PWAとして起動している場合はスキップ
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // 30日間の非表示チェック
    const dismissed = localStorage.getItem("install-guide-dismissed");
    if (dismissed) {
      const dismissedAt = new Date(dismissed);
      const daysSince = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) return;
    }

    // iOS判定
    const userAgent = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(userAgent);
    setIsIos(ios);

    // 少し遅延してから表示
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("install-guide-dismissed", new Date().toISOString());
  };

  if (!show) return null;

  return (
    <div
      className={`fixed bottom-20 lg:bottom-4 left-4 right-4 z-50 max-w-[400px] mx-auto transition-all duration-500 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div
        className="relative rounded-xl overflow-hidden border border-border-gold"
        style={{
          background: "#ffffff",
          boxShadow: "0 10px 40px rgba(0,0,0,0.25), 0 0 20px rgba(201,168,76,0.15)",
        }}
      >
        {/* 閉じるボタン */}
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all cursor-pointer text-xs"
          aria-label="閉じる"
        >
          ✕
        </button>

        <div className="p-4">
          {/* メインメッセージ */}
          <div className="flex items-center gap-3 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_home.png" alt="BioVault" className="w-10 h-10 rounded-lg" />
            <div>
              <div className="text-sm font-medium" style={{ color: "#1a1a1a" }}>
                BioVaultをホーム画面に追加
              </div>
              <div className="text-[11px]" style={{ color: "#888888" }}>
                アプリのように快適に利用できます
              </div>
            </div>
          </div>

          {/* 通知に関する補足 */}
          {isIos && (
            <div className="border-l-2 border-gold px-3 py-2 rounded-r-md mb-3 mt-3" style={{ background: "rgba(191,160,75,0.06)" }}>
              <div className="text-[11px] leading-relaxed" style={{ color: "#555555" }}>
                iPhoneで更新通知を受け取るには、ホーム画面への追加が必要です。
              </div>
            </div>
          )}

          {/* 詳細手順の表示切替 */}
          {!showDetail ? (
            <button
              onClick={() => setShowDetail(true)}
              className="mt-2 w-full py-2.5 text-[12px] rounded-lg border transition-all cursor-pointer"
              style={{
                color: "#8C6E2A",
                borderColor: "rgba(191,160,75,0.35)",
              }}
            >
              追加方法を見る
            </button>
          ) : (
            <div className="mt-3 space-y-3">
              {isIos ? (
                /* iOS用手順 */
                <div className="space-y-2.5">
                  <StepItem step={1} text="検索バーの共有ボタン［↑］をタップ" />
                  <StepItem step={2} text="「ホーム画面に追加」をタップ" />
                  <StepItem step={3} text="右上の「追加」をタップ" />
                  <div className="text-[10px] mt-2 leading-relaxed" style={{ color: "#999999" }}>
                    ※ 追加後は、ホーム画面より手軽にご利用いただけます。
                  </div>
                </div>
              ) : (
                /* Android用手順 */
                <div className="space-y-2.5">
                  <StepItem step={1} text="ブラウザのメニュー（⋮）をタップ" />
                  <StepItem step={2} text="「ホーム画面に追加」または「アプリをインストール」をタップ" />
                  <StepItem step={3} text="「追加」をタップ" />
                  <div className="text-[10px] mt-2 leading-relaxed" style={{ color: "#999999" }}>
                    ※ 追加後は、ホーム画面より手軽にご利用いただけます。
                  </div>
                </div>
              )}

              <button
                onClick={handleDismiss}
                className="w-full py-2 text-[11px] transition-colors cursor-pointer"
                style={{ color: "#aaaaaa" }}
              >
                閉じる（30日間非表示）
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepItem({ step, text }: { step: number; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div
        className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
        style={{ background: "rgba(191,160,75,0.15)", color: "#8C6E2A" }}
      >
        {step}
      </div>
      <div className="text-[12px] leading-relaxed" style={{ color: "#444444" }}>{text}</div>
    </div>
  );
}
