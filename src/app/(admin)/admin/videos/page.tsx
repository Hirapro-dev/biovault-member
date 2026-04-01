"use client";

import { useState, useEffect } from "react";

interface Video {
  id: string;
  title: string;
  description: string | null;
  youtubeUrl: string;
  youtubeId: string;
  thumbnailUrl: string | null;
  isPublished: boolean;
  publishedAt: string;
  author: string;
  createdAt: string;
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    youtubeUrl: "",
    isPublished: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchVideos = async () => {
    const res = await fetch("/api/admin/videos");
    const data = await res.json();
    setVideos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const resetForm = () => {
    setForm({ title: "", description: "", youtubeUrl: "", isPublished: false });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (video: Video) => {
    setForm({
      title: video.title,
      description: video.description || "",
      youtubeUrl: video.youtubeUrl,
      isPublished: video.isPublished,
    });
    setEditingId(video.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const url = editingId
        ? `/api/admin/videos/${editingId}`
        : "/api/admin/videos";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMessage(editingId ? "動画を更新しました" : "動画を追加しました");
        resetForm();
        fetchVideos();
      } else {
        const data = await res.json();
        setMessage(`エラー: ${data.error}`);
      }
    } catch {
      setMessage("エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (video: Video) => {
    await fetch(`/api/admin/videos/${video.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !video.isPublished }),
    });
    fetchVideos();
  };

  const deleteVideo = async (id: string) => {
    if (!confirm("この動画を削除しますか？")) return;
    await fetch(`/api/admin/videos/${id}`, { method: "DELETE" });
    fetchVideos();
  };

  // YouTube URLからプレビュー用IDを抽出
  const extractPreviewId = (url: string): string | null => {
    const patterns = [
      /youtu\.be\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  };

  const previewId = extractPreviewId(form.youtubeUrl);

  return (
    <div>
      <div className="flex justify-between items-center mb-7">
        <h2 className="font-serif-jp text-[22px] font-normal text-text-primary tracking-[2px]">
          動画管理
        </h2>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-5 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer transition-all duration-300 hover:opacity-90"
        >
          {showForm ? "✕ 閉じる" : "+ 動画を追加"}
        </button>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-status-active/10 border border-status-active/20 rounded text-status-active text-xs">
          {message}
        </div>
      )}

      {/* 動画追加/編集フォーム */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-bg-secondary border border-border-gold rounded-md p-6 mb-8">
          <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-5 pb-3 border-b border-border">
            {editingId ? "動画を編集" : "新しい動画を追加"}
          </h3>

          <div className="mb-4">
            <label className="block text-[11px] text-text-secondary tracking-wider mb-2">
              タイトル <span className="text-status-danger">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="動画のタイトル"
              required
              className="w-full px-4 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none focus:border-border-gold"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[11px] text-text-secondary tracking-wider mb-2">
              YouTube URL <span className="text-status-danger">*</span>
            </label>
            <input
              value={form.youtubeUrl}
              onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=... または https://youtu.be/..."
              required
              className="w-full px-4 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none focus:border-border-gold font-mono"
            />
          </div>

          {/* YouTube プレビュー */}
          {previewId && (
            <div className="mb-4">
              <label className="block text-[10px] text-text-muted tracking-wider mb-2">プレビュー</label>
              <div className="aspect-video rounded-md overflow-hidden bg-black max-w-md">
                <iframe
                  src={`https://www.youtube.com/embed/${previewId}`}
                  title="プレビュー"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-[11px] text-text-secondary tracking-wider mb-2">
              説明文
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="動画の説明..."
              rows={3}
              className="w-full px-4 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none resize-none focus:border-border-gold"
            />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="cursor-pointer"
              />
              <span className="text-[13px] text-text-secondary">公開する</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2.5 bg-gold-gradient text-bg-primary rounded-sm text-[13px] font-semibold tracking-wider cursor-pointer hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "保存中..." : editingId ? "更新" : "追加"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2.5 border border-border text-text-secondary rounded-sm text-[13px] cursor-pointer hover:border-border-gold hover:text-gold transition-all"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* 動画一覧 */}
      {loading ? (
        <div className="text-center py-16 text-text-muted text-sm">読み込み中...</div>
      ) : videos.length === 0 ? (
        <div className="bg-bg-secondary border border-border rounded-md p-16 text-center">
          <div className="text-3xl mb-4">🎬</div>
          <p className="text-sm text-text-muted mb-2">動画がありません</p>
          <p className="text-xs text-text-muted">「+ 動画を追加」からYouTube動画を追加してください</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {videos.map((video) => (
            <div key={video.id} className="bg-bg-secondary border border-border rounded-md overflow-hidden">
              {/* サムネイル */}
              <div className="aspect-video bg-black relative">
                {video.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🎬</div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    video.isPublished
                      ? "bg-status-active/20 text-status-active border-status-active/30"
                      : "bg-black/60 text-text-muted border-white/10"
                  }`}>
                    {video.isPublished ? "公開中" : "下書き"}
                  </span>
                </div>
              </div>
              {/* 情報 */}
              <div className="p-4">
                <h3 className="text-sm text-text-primary font-medium line-clamp-2 mb-1">{video.title}</h3>
                <div className="text-[10px] text-text-muted font-mono mb-3">
                  {new Date(video.publishedAt).toLocaleDateString("ja-JP")}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => togglePublish(video)}
                    className="px-3 py-1.5 border border-border text-text-muted rounded-sm text-[11px] cursor-pointer hover:border-border-gold hover:text-gold transition-all"
                  >
                    {video.isPublished ? "非公開" : "公開"}
                  </button>
                  <button
                    onClick={() => startEdit(video)}
                    className="px-3 py-1.5 border border-border text-text-secondary rounded-sm text-[11px] cursor-pointer hover:border-border-gold hover:text-gold transition-all"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => deleteVideo(video.id)}
                    className="px-3 py-1.5 border border-border text-text-muted rounded-sm text-[11px] cursor-pointer hover:border-status-danger/50 hover:text-status-danger transition-all"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
