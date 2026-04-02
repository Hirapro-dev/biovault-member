"use client";

import { useState, useEffect } from "react";

interface ExternalNewsItem {
  id: string;
  title: string;
  summary: string | null;
  sourceUrl: string;
  sourceName: string;
  imageUrl: string | null;
  isPublished: boolean;
  publishedAt: string;
  fetchedAt: string;
}

export default function AdminNewsPage() {
  const [news, setNews] = useState<ExternalNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"published" | "unpublished">("unpublished");
  const [previewItem, setPreviewItem] = useState<ExternalNewsItem | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);

  const fetchNews = async () => {
    const res = await fetch("/api/admin/fetch-news");
    const data = await res.json();
    setNews(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // ニュース取得ボタン
  const handleFetchNews = async () => {
    setFetching(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/fetch-news", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ ${data.message}`);
        fetchNews();
        setActiveTab("unpublished");
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch {
      setMessage("❌ ニュース取得に失敗しました");
    } finally {
      setFetching(false);
    }
  };

  // 記事プレビュー
  const openPreview = async (item: ExternalNewsItem) => {
    setPreviewItem(item);
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/admin/fetch-news/${item.id}`);
      if (res.ok) {
        const updated = await res.json();
        setPreviewItem(updated);
        setNews((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      }
    } catch {
      // プレビューは表示する
    } finally {
      setPreviewLoading(false);
    }
  };

  // 公開する → 公開中タブに自動移動 + プッシュ通知
  const handlePublish = async (item: ExternalNewsItem) => {
    setPublishing(item.id);
    await fetch("/api/admin/fetch-news", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, isPublished: true }),
    });
    await fetchNews();
    setPublishing(null);
    setPreviewItem(null);
    setActiveTab("published");
    setMessage(`✅ 「${item.title.length > 30 ? item.title.slice(0, 30) + "..." : item.title}」を公開しました`);
    setTimeout(() => setMessage(""), 4000);
  };

  // 非公開にする
  const handleUnpublish = async (item: ExternalNewsItem) => {
    await fetch("/api/admin/fetch-news", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, isPublished: false }),
    });
    await fetchNews();
    setPreviewItem(null);
  };

  const publishedNews = news.filter((n) => n.isPublished);
  const unpublishedNews = news.filter((n) => !n.isPublished);

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-7">
        <h2 className="font-serif-jp text-[22px] font-normal text-text-primary tracking-[2px]">
          ニュース管理
        </h2>
        <button
          onClick={handleFetchNews}
          disabled={fetching}
          className="px-5 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer transition-all duration-300 hover:opacity-90 disabled:opacity-50"
        >
          {fetching ? "取得中..." : "📡 ニュース取得"}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded text-xs transition-all ${
          message.startsWith("✅")
            ? "bg-status-active/10 border border-status-active/20 text-status-active"
            : "bg-status-danger/10 border border-status-danger/20 text-status-danger"
        }`}>
          {message}
        </div>
      )}

      {/* タブ切り替え */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("unpublished")}
          className={`text-[12px] px-4 py-2 rounded-full border transition-all cursor-pointer ${
            activeTab === "unpublished"
              ? "bg-gold/15 text-gold border-gold/30 font-medium"
              : "bg-transparent text-text-muted border-border hover:border-border-gold"
          }`}
        >
          未公開 ({unpublishedNews.length})
        </button>
        <button
          onClick={() => setActiveTab("published")}
          className={`text-[12px] px-4 py-2 rounded-full border transition-all cursor-pointer ${
            activeTab === "published"
              ? "bg-gold/15 text-gold border-gold/30 font-medium"
              : "bg-transparent text-text-muted border-border hover:border-border-gold"
          }`}
        >
          公開中 ({publishedNews.length})
        </button>
      </div>

      {/* ════ プレビューモーダル ════ */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
          <div className="bg-bg-secondary border border-border rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

            {previewLoading && (
              <div className="p-4 text-center">
                <div className="text-xs text-text-muted animate-pulse">記事情報を取得中...</div>
              </div>
            )}

            {previewItem.imageUrl && (
              <div className="w-full aspect-[16/9] overflow-hidden rounded-t-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewItem.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-info/10 text-status-info border border-status-info/20">
                  {previewItem.sourceName}
                </span>
                <span className="text-[11px] text-text-muted font-mono">
                  {new Date(previewItem.publishedAt).toLocaleDateString("ja-JP")}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  previewItem.isPublished
                    ? "bg-status-active/10 text-status-active border-status-active/20"
                    : "bg-text-muted/10 text-text-muted border-text-muted/20"
                }`}>
                  {previewItem.isPublished ? "公開中" : "未公開"}
                </span>
              </div>

              <h2 className="text-lg text-text-primary font-medium leading-relaxed mb-4">
                {previewItem.title}
              </h2>

              {previewItem.summary ? (
                <div className="bg-bg-tertiary border border-border rounded-md p-5 mb-4">
                  <div className="text-[10px] text-text-muted tracking-wider mb-2">記事の要約</div>
                  <p className="text-sm text-text-primary leading-relaxed">
                    {previewItem.summary}
                  </p>
                </div>
              ) : !previewLoading ? (
                <div className="bg-bg-tertiary border border-border rounded-md p-5 mb-4 text-center">
                  <p className="text-xs text-text-muted">記事の要約を取得できませんでした</p>
                </div>
              ) : null}

              <a
                href={previewItem.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-bg-tertiary border border-border rounded-md text-sm text-gold hover:border-border-gold transition-all mb-4"
              >
                元記事を読む →
              </a>

              <div className="flex gap-3">
                {previewItem.isPublished ? (
                  <button
                    onClick={() => handleUnpublish(previewItem)}
                    className="flex-1 py-3 rounded-sm text-[13px] font-medium cursor-pointer transition-all border border-border text-text-secondary hover:border-status-danger/50 hover:text-status-danger"
                  >
                    非公開にする
                  </button>
                ) : (
                  <button
                    onClick={() => handlePublish(previewItem)}
                    disabled={publishing === previewItem.id}
                    className="flex-1 py-3 rounded-sm text-[13px] font-medium cursor-pointer transition-all bg-gold-gradient text-bg-primary hover:opacity-90 disabled:opacity-50"
                  >
                    {publishing === previewItem.id ? "公開中..." : "公開する"}
                  </button>
                )}
                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-6 py-3 border border-border text-text-muted rounded-sm text-[13px] cursor-pointer hover:border-border-gold hover:text-gold transition-all"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ 記事リスト ════ */}
      {loading ? (
        <div className="text-center py-16 text-text-muted text-sm">読み込み中...</div>
      ) : (activeTab === "published" ? publishedNews : unpublishedNews).length === 0 ? (
        <div className="bg-bg-secondary border border-border rounded-md p-16 text-center">
          <div className="text-3xl mb-4">📡</div>
          <p className="text-sm text-text-muted mb-2">
            {activeTab === "published" ? "公開中のニュースはありません" : "未公開のニュースはありません"}
          </p>
          <p className="text-xs text-text-muted">
            {activeTab === "published"
              ? "「未公開」タブから記事を確認して公開してください"
              : "右上の「ニュース取得」ボタンで最新ニュースを取得してください"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {(activeTab === "published" ? publishedNews : unpublishedNews).map((item) => (
            <div
              key={item.id}
              className="bg-bg-secondary border border-border rounded-md p-4 flex gap-4 hover:border-border-gold transition-all cursor-pointer"
              onClick={() => openPreview(item)}
            >
              {/* サムネイル */}
              <div className="w-[100px] shrink-0">
                {item.imageUrl ? (
                  <div className="w-full aspect-[16/9] rounded overflow-hidden bg-bg-elevated">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full aspect-[16/9] rounded bg-bg-elevated flex items-center justify-center text-xl opacity-20">
                    📰
                  </div>
                )}
              </div>

              {/* コンテンツ */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-text-muted">{item.sourceName}</span>
                  <span className="text-[10px] text-text-muted font-mono">
                    {new Date(item.publishedAt).toLocaleDateString("ja-JP")}
                  </span>
                </div>
                <h3 className="text-[13px] text-text-primary line-clamp-2 leading-snug">
                  {item.title}
                </h3>
                {item.summary && (
                  <p className="text-[11px] text-text-muted line-clamp-1 mt-1">{item.summary}</p>
                )}
              </div>

              {/* 公開ボタン / ステータス */}
              <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                {item.isPublished ? (
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-status-active/10 text-status-active border border-status-active/20">
                    公開中
                  </span>
                ) : (
                  <button
                    onClick={() => handlePublish(item)}
                    disabled={publishing === item.id}
                    className="text-[11px] px-3 py-1.5 rounded bg-gold-gradient text-bg-primary font-medium cursor-pointer hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {publishing === item.id ? "..." : "公開"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
