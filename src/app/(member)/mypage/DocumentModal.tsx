"use client";

import { useState, useEffect, useCallback } from "react";

type DocumentModalProps = {
  label: string;
  pdfUrl?: string | null;
  pageUrl: string;
  done: boolean;
};

/**
 * 書類モーダルコンポーネント
 * - PDFがある場合 → 新しいタブでPDFを開く
 * - PDFがない場合 → ページ内モーダルで書類内容を表示（iframe）
 * 高齢者ユーザーがページ遷移で迷わないようにモーダルで表示する
 */
export default function DocumentModal({ label, pdfUrl, pageUrl, done }: DocumentModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // ESCキーでモーダルを閉じる
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setIsOpen(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleEsc]);

  const handleClick = () => {
    if (pdfUrl) {
      // PDFの場合は新しいタブで開く
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
      return;
    }
    // それ以外はモーダルで表示
    setIsOpen(true);
  };

  if (!done) return <span className="text-[13px] sm:text-sm text-text-muted">{label}</span>;

  return (
    <>
      <button
        onClick={handleClick}
        className="text-[13px] sm:text-sm text-gold hover:underline underline-offset-2 text-left cursor-pointer bg-transparent border-none p-0 m-0 font-normal"
      >
        {label}
        <span className="text-[10px] ml-1 opacity-60">{pdfUrl ? "📎" : "📄"}</span>
      </button>

      {/* モーダル */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
          onClick={() => setIsOpen(false)}
        >
          {/* オーバーレイ */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* モーダル本体 */}
          <div
            className="relative z-[101] w-full max-w-[800px] h-[85vh] bg-bg-primary border border-border rounded-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border shrink-0">
              <h3 className="font-serif-jp text-sm sm:text-base text-text-primary tracking-wider truncate pr-3">{label}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-elevated text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors cursor-pointer text-lg border-none shrink-0"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            {/* コンテンツ（iframe） */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={pageUrl}
                className="w-full h-full border-none"
                title={label}
              />
            </div>

            {/* フッター */}
            <div className="px-4 sm:px-5 py-3 border-t border-border shrink-0">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-2.5 bg-bg-elevated border border-border text-text-secondary rounded text-sm hover:border-border-gold hover:text-gold transition-all cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
