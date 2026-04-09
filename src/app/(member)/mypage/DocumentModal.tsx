"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type DocumentModalProps = {
  label: string;
  pdfUrl?: string | null;
  pageUrl: string;
  done: boolean;
};

/**
 * 書類モーダルコンポーネント
 * - PDFがある場合 → 新しいタブでPDFを開く
 * - PDFがない場合 → fetchで書類本文のみ取得し、ページ内モーダルで表示
 * 高齢者ユーザーがページ遷移で迷わないようにモーダルで表示する
 */
export default function DocumentModal({ label, pdfUrl, pageUrl, done }: DocumentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

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

  // モーダルを開いたらコンテンツをスクロール位置リセット
  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  const handleClick = async () => {
    if (pdfUrl) {
      // PDFの場合は新しいタブで開く
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
      return;
    }
    // モーダルを開く
    setIsOpen(true);

    // 既にコンテンツ取得済みなら再取得しない
    if (content) return;

    // ページをfetchして本文（articleタグ）のみ抽出
    setLoading(true);
    try {
      const res = await fetch(pageUrl);
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // articleタグの中身を取得（書類ページの本文コンテンツ）
      const article = doc.querySelector("article");
      if (article) {
        setContent(article.innerHTML);
      } else {
        // articleがない場合はbg-bg-secondary内のコンテンツを試行
        const section = doc.querySelector(".bg-bg-secondary");
        setContent(section?.innerHTML || "<p>内容を読み込めませんでした。</p>");
      }
    } catch {
      setContent("<p>内容を読み込めませんでした。</p>");
    } finally {
      setLoading(false);
    }
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
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={() => setIsOpen(false)}
        >
          {/* オーバーレイ */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          {/* モーダル本体 — 画面中央配置、上下左右にマージン確保 */}
          <div
            className="relative z-[101] w-[calc(100%-24px)] sm:w-[calc(100%-48px)] max-w-[760px] max-h-[calc(100dvh-48px)] sm:max-h-[calc(100dvh-64px)] bg-bg-primary border border-border rounded-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-border shrink-0">
              <h3 className="font-serif-jp text-[13px] sm:text-base text-text-primary tracking-wider truncate pr-3">{label}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-elevated text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors cursor-pointer text-lg border-none shrink-0"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            {/* 本文コンテンツ（書類のarticle部分のみ） */}
            <div ref={contentRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-text-muted text-sm">読み込み中...</div>
                </div>
              ) : content ? (
                <article
                  className="text-xs sm:text-sm text-text-secondary leading-[2] space-y-5 [&_h2]:text-sm [&_h2]:text-text-primary [&_h2]:font-medium [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:text-text-primary [&_h3]:font-medium [&_h3]:mb-2 [&_section]:space-y-2 [&_ul]:space-y-1 [&_ul]:pl-2"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : null}
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
