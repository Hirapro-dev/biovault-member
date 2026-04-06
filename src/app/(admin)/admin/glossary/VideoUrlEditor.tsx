"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VideoUrlEditor({ currentUrl, currentTitle }: { currentUrl: string; currentTitle: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(currentUrl);
  const [title, setTitle] = useState(currentTitle);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // YouTubeのIDを抽出してプレビュー表示用
  const extractYoutubeId = (videoUrl: string) => {
    const match = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([^?&]+)/);
    return match?.[1] || null;
  };

  const youtubeId = extractYoutubeId(url);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await Promise.all([
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "ips_video_url", title: "iPSとは？動画URL", content: url.trim() }),
        }),
        fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "ips_video_title", title: "iPSとは？動画タイトル", content: title.trim() }),
        }),
      ]);
      setMessage("保存しました");
      setEditing(false);
      router.refresh();
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-6 mb-6">
      <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
        動画管理
      </h3>
      <p className="text-xs text-text-muted mb-4">「iPSとは？」ページ上部に表示される動画のURLを設定します。YouTube URLに対応しています。</p>

      {message && <div className="mb-3 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px]">{message}</div>}

      {/* プレビュー */}
      {youtubeId && (
        <div className="mb-4 aspect-video max-w-md rounded-lg overflow-hidden bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}`}
            title="動画プレビュー"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      )}

      {!editing ? (
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            {currentTitle && <div className="text-sm text-text-primary mb-1">{currentTitle}</div>}
            <div className="text-[11px] text-text-muted mb-1">現在のURL</div>
            <div className="text-xs text-text-secondary font-mono break-all">{currentUrl || "未設定"}</div>
          </div>
          <button onClick={() => setEditing(true)} className="px-4 py-2 bg-transparent border border-border text-text-secondary rounded-sm text-xs cursor-pointer hover:border-border-gold hover:text-gold transition-all shrink-0">
            変更
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-text-muted mb-1">動画タイトル</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: iPS細胞について"
              className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold"
            />
          </div>
          <div>
            <label className="block text-[11px] text-text-muted mb-1">YouTube URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary font-mono outline-none focus:border-border-gold"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setEditing(false); setUrl(currentUrl); }} className="px-4 py-2 bg-transparent border border-border text-text-secondary rounded-sm text-xs cursor-pointer hover:border-border-gold transition-all">
              キャンセル
            </button>
            <button onClick={handleSave} disabled={saving || !url.trim()} className="px-4 py-2 bg-gold-gradient border-none rounded-sm text-bg-primary text-xs font-semibold cursor-pointer hover:opacity-90 transition-all disabled:opacity-50">
              {saving ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
