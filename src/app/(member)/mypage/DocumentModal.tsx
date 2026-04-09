"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

type DocumentModalProps = {
  label: string;
  pdfUrl?: string | null;
  pageUrl: string;
  done: boolean;
};

/**
 * 書類モーダルコンポーネント
 * - PDFがある場合 → Google Docs Viewerで全ページ表示（ページ送り対応）
 * - PDFがない場合 → fetchで書類本文のみ取得し、モーダルで表示
 * - createPortalでbody直下にレンダリングし、確実にビューポート中央に表示
 *
 * サイズ設計:
 *   PC PDF: 幅600px × 高さ70vh（大きすぎない）
 *   SP PDF: 画面幅-24px × 高さ80dvh
 *   PC HTML: 幅760px × 高さ自動（最大80dvh）
 *   SP HTML: 画面幅-24px × 高さ自動（最大85dvh）
 */
export default function DocumentModal({ label, pdfUrl, pageUrl, done }: DocumentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    if (isOpen && contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [isOpen, content]);

  const handleClick = async () => {
    setIsOpen(true);
    if (pdfUrl) return;
    if (content) return;

    setLoading(true);
    try {
      const res = await fetch(pageUrl);
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const article = doc.querySelector("article");
      if (article) {
        setContent(article.innerHTML);
      } else {
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

  const isPdf = !!pdfUrl;

  // Google Docs ViewerでPDFを表示（全ページスクロール・ページ番号付き）
  const viewerUrl = isPdf
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl!)}`
    : null;

  const modalContent = isOpen && mounted ? createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px",
      }}
      onClick={() => setIsOpen(false)}
    >
      {/* オーバーレイ */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* モーダル本体 */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: isPdf ? "min(760px, calc(100% - 0px))" : "min(760px, 100%)",
          maxWidth: "760px",
          height: isPdf ? "min(85vh, 840px)" : undefined,
          maxHeight: "calc(100dvh - 24px)",
          backgroundColor: "var(--color-bg-primary)",
          border: "1px solid var(--color-border)",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column" as const,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            borderBottom: "1px solid var(--color-border)",
            flexShrink: 0,
          }}
        >
          <h3
            style={{
              fontSize: "13px",
              color: "var(--color-text-primary)",
              letterSpacing: "0.05em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              paddingRight: "12px",
              margin: 0,
              fontWeight: 400,
            }}
          >
            {label}
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            style={{
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              backgroundColor: "var(--color-bg-elevated)",
              color: "var(--color-text-muted)",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
              flexShrink: 0,
            }}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        {/* コンテンツ */}
        {isPdf ? (
          /* PDF: Google Docs Viewerで全ページ表示 */
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <iframe
              src={viewerUrl!}
              style={{
                flex: 1,
                width: "100%",
                border: "none",
                backgroundColor: "#f0f0f0",
              }}
              title={label}
              allow="autoplay"
            />
            {/* フォールバック: 別タブで直接開く */}
            <div
              style={{
                padding: "6px 16px",
                borderTop: "1px solid var(--color-border)",
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              <a
                href={pdfUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-gold hover:underline"
              >
                PDFを別タブで開く →
              </a>
            </div>
          </div>
        ) : (
          /* HTML書類の本文表示 */
          <div
            ref={contentRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6"
            style={{ minHeight: 0 }}
          >
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-text-muted text-sm">読み込み中...</div>
              </div>
            ) : content ? (
              <article
                className="text-xs sm:text-sm text-text-secondary leading-[2] space-y-5 [&_h2]:text-sm [&_h2]:text-text-primary [&_h2]:font-medium [&_h2]:mb-2 [&_h3]:text-sm [&_h3]:text-text-primary [&_h3]:font-medium [&_h3]:mb-2 [&_h4]:text-sm [&_h4]:text-text-primary [&_h4]:font-medium [&_h4]:mb-2 [&_section]:space-y-2 [&_ul]:space-y-1 [&_ul]:pl-2"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            ) : null}
          </div>
        )}

        {/* フッター */}
        <div
          style={{
            padding: "10px 16px",
            borderTop: "1px solid var(--color-border)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-2 bg-bg-elevated border border-border text-text-secondary rounded text-sm hover:border-border-gold hover:text-gold transition-all cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        onClick={handleClick}
        className="text-[13px] sm:text-sm text-gold hover:underline underline-offset-2 text-left cursor-pointer bg-transparent border-none p-0 m-0 font-normal"
      >
        {label}
        <span className="text-[10px] ml-1 opacity-60">{isPdf ? "📎" : "📄"}</span>
      </button>
      {modalContent}
    </>
  );
}
