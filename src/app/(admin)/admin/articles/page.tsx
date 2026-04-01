"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const CATEGORY_OPTIONS = [
  { value: "NEWS", label: "ニュース" },
  { value: "RESEARCH", label: "研究動向" },
  { value: "CLINICAL", label: "臨床応用" },
  { value: "REGULATION", label: "制度・規制" },
  { value: "MARKET", label: "市場動向" },
];

interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  imageUrl: string | null;
  sourceUrl: string | null;
  sourceName: string | null;
  isPublished: boolean;
  publishedAt: string;
  author: string;
  createdAt: string;
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
    category: "NEWS",
    imageUrl: "",
    sourceUrl: "",
    sourceName: "",
    isPublished: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const fetchArticles = async () => {
    const res = await fetch("/api/admin/articles");
    const data = await res.json();
    setArticles(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const resetForm = () => {
    setForm({
      title: "",
      summary: "",
      content: "",
      category: "NEWS",
      imageUrl: "",
      sourceUrl: "",
      sourceName: "",
      isPublished: false,
    });
    setEditingId(null);
    setShowEditor(false);
    setShowPreview(false);
  };

  const startEdit = (article: Article) => {
    setForm({
      title: article.title,
      summary: article.summary,
      content: article.content,
      category: article.category,
      imageUrl: article.imageUrl || "",
      sourceUrl: article.sourceUrl || "",
      sourceName: article.sourceName || "",
      isPublished: article.isPublished,
    });
    setEditingId(article.id);
    setShowEditor(true);
    setShowPreview(false);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (publish?: boolean) => {
    setSaving(true);
    setMessage("");

    const submitData = {
      ...form,
      isPublished: publish !== undefined ? publish : form.isPublished,
    };

    try {
      const url = editingId
        ? `/api/admin/articles/${editingId}`
        : "/api/admin/articles";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        setMessage(editingId ? "記事を更新しました" : "記事を作成しました");
        resetForm();
        fetchArticles();
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

  const togglePublish = async (article: Article) => {
    await fetch(`/api/admin/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !article.isPublished }),
    });
    fetchArticles();
  };

  const deleteArticle = async (id: string) => {
    if (!confirm("この記事を削除しますか？")) return;
    await fetch(`/api/admin/articles/${id}`, { method: "DELETE" });
    fetchArticles();
  };

  // エディター表示中
  if (showEditor) {
    return (
      <div>
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={resetForm}
              className="text-text-muted hover:text-gold transition-colors text-sm cursor-pointer"
            >
              ← 戻る
            </button>
            <h2 className="font-serif-jp text-lg font-normal text-text-primary tracking-wider">
              {editingId ? "記事を編集" : "新規記事"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-4 py-2 border rounded-sm text-xs cursor-pointer transition-all ${
                showPreview
                  ? "border-gold/30 text-gold bg-gold/5"
                  : "border-border text-text-secondary hover:border-border-gold hover:text-gold"
              }`}
            >
              {showPreview ? "✕ プレビューを閉じる" : "👁 プレビュー"}
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-status-active/10 border border-status-active/20 rounded text-status-active text-xs">
            {message}
          </div>
        )}

        <div className={`grid gap-6 ${showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
          {/* 左側: エディター */}
          <div className="space-y-5">
            {/* タイトル */}
            <div>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="記事タイトルを入力..."
                className="w-full px-0 py-3 bg-transparent border-none text-xl text-text-primary outline-none placeholder:text-text-muted/50 font-serif-jp"
              />
              <div className="h-[1px] bg-border" />
            </div>

            {/* サムネイル画像 */}
            <ImageUploader
              imageUrl={form.imageUrl}
              onUpload={(url) => setForm({ ...form, imageUrl: url })}
              onRemove={() => setForm({ ...form, imageUrl: "" })}
            />

            {/* メタ情報（カテゴリ・出典） */}
            <div className="bg-bg-secondary border border-border rounded-md p-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] text-text-muted tracking-wider mb-1.5">カテゴリ</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none cursor-pointer focus:border-border-gold"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-text-muted tracking-wider mb-1.5">出典名</label>
                  <input
                    value={form.sourceName}
                    onChange={(e) => setForm({ ...form, sourceName: e.target.value })}
                    placeholder="京都大学, Nature..."
                    className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none focus:border-border-gold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-text-muted tracking-wider mb-1.5">出典URL</label>
                <input
                  value={form.sourceUrl}
                  onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none focus:border-border-gold"
                />
              </div>
            </div>

            {/* 要約 */}
            <div>
              <label className="block text-[10px] text-text-muted tracking-wider mb-1.5">
                要約 <span className="text-text-muted">（空欄時は本文の先頭200文字を使用）</span>
              </label>
              <textarea
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
                placeholder="記事の要約を入力..."
                rows={2}
                className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-md text-text-primary text-sm outline-none resize-none focus:border-border-gold leading-relaxed"
              />
            </div>

            {/* リッチテキストエディター */}
            <div>
              <label className="block text-[10px] text-text-muted tracking-wider mb-1.5">
                本文 <span className="text-status-danger">*</span>
              </label>
              <RichTextEditor
                value={form.content}
                onChange={(v) => setForm({ ...form, content: v })}
              />
            </div>

            {/* 公開アクション */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={saving || !form.title || !form.content}
                  className="px-6 py-2.5 border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold hover:text-gold transition-all disabled:opacity-30"
                >
                  {saving ? "保存中..." : "下書き保存"}
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={saving || !form.title || !form.content}
                  className="px-8 py-2.5 bg-gold-gradient text-bg-primary rounded-sm text-sm font-semibold tracking-wider cursor-pointer hover:opacity-90 transition-all disabled:opacity-30"
                >
                  {saving ? "公開中..." : editingId ? "更新して公開" : "公開する"}
                </button>
              </div>
              <button
                onClick={resetForm}
                className="text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
              >
                キャンセル
              </button>
            </div>
          </div>

          {/* 右側: プレビュー */}
          {showPreview && (
            <div className="bg-bg-secondary border border-border rounded-md p-6 overflow-y-auto max-h-[80vh]">
              <div className="text-[10px] text-text-muted tracking-wider mb-4 pb-2 border-b border-border">
                プレビュー
              </div>
              {form.imageUrl && (
                <div className="w-full aspect-[2/1] rounded-md overflow-hidden mb-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
                  {CATEGORY_OPTIONS.find((c) => c.value === form.category)?.label}
                </span>
                <span className="text-[11px] text-text-muted font-mono">
                  {new Date().toLocaleDateString("ja-JP")}
                </span>
              </div>
              <h2 className="text-lg text-text-primary font-medium leading-relaxed mb-3">
                {form.title || "タイトル未入力"}
              </h2>
              {form.summary && (
                <p className="text-sm text-text-secondary mb-4 leading-relaxed">{form.summary}</p>
              )}
              <div className="h-[1px] bg-border mb-4" />
              <div
                className="text-sm text-text-primary leading-[2] space-y-4"
                dangerouslySetInnerHTML={{
                  __html: form.content
                    ? form.content
                        .split("\n\n")
                        .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
                        .join("")
                    : "<p class='text-text-muted'>本文を入力してください...</p>",
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // 記事一覧表示
  return (
    <div>
      <div className="flex justify-between items-center mb-7">
        <h2 className="font-serif-jp text-[22px] font-normal text-text-primary tracking-[2px]">
          iPS ニュース管理
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowEditor(true);
          }}
          className="px-5 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer transition-all duration-300 hover:opacity-90"
        >
          + 新規記事
        </button>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-status-active/10 border border-status-active/20 rounded text-status-active text-xs">
          {message}
        </div>
      )}

      {/* 記事一覧 */}
      {loading ? (
        <div className="text-center py-16 text-text-muted text-sm">読み込み中...</div>
      ) : articles.length === 0 ? (
        <div className="bg-bg-secondary border border-border rounded-md p-16 text-center">
          <div className="text-3xl mb-4">📝</div>
          <p className="text-sm text-text-muted mb-2">記事がありません</p>
          <p className="text-xs text-text-muted">「+ 新規記事」から作成してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-bg-secondary border border-border rounded-md p-4 flex gap-4 hover:border-border-gold transition-all"
            >
              {/* サムネイル */}
              {article.imageUrl ? (
                <div className="w-20 h-20 rounded-md overflow-hidden shrink-0 bg-bg-elevated">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-md shrink-0 bg-bg-elevated flex items-center justify-center text-2xl text-text-muted/30">
                  📄
                </div>
              )}

              {/* コンテンツ */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
                    {CATEGORY_OPTIONS.find((c) => c.value === article.category)?.label || article.category}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      article.isPublished
                        ? "bg-status-active/10 text-status-active border-status-active/20"
                        : "bg-text-muted/10 text-text-muted border-text-muted/20"
                    }`}
                  >
                    {article.isPublished ? "公開中" : "下書き"}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">
                    {new Date(article.publishedAt).toLocaleDateString("ja-JP")}
                  </span>
                </div>
                <h3 className="text-[13px] text-text-primary truncate">{article.title}</h3>
                <p className="text-[11px] text-text-muted mt-0.5 line-clamp-1">{article.summary}</p>
              </div>

              {/* アクション */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => togglePublish(article)}
                  className="px-3 py-1.5 border border-border text-text-muted rounded-sm text-[11px] cursor-pointer hover:border-border-gold hover:text-gold transition-all"
                >
                  {article.isPublished ? "非公開" : "公開"}
                </button>
                <button
                  onClick={() => startEdit(article)}
                  className="px-3 py-1.5 border border-border text-text-secondary rounded-sm text-[11px] cursor-pointer hover:border-border-gold hover:text-gold transition-all"
                >
                  編集
                </button>
                <button
                  onClick={() => deleteArticle(article.id)}
                  className="px-3 py-1.5 border border-border text-text-muted rounded-sm text-[11px] cursor-pointer hover:border-status-danger/50 hover:text-status-danger transition-all"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 画像アップローダーコンポーネント ──
function ImageUploader({
  imageUrl,
  onUpload,
  onRemove,
}: {
  imageUrl: string;
  onUpload: (url: string) => void;
  onRemove: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        onUpload(data.url);
      }
    } catch {
      // アップロード失敗
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (imageUrl) {
    return (
      <div className="relative group">
        <div className="w-full aspect-[3/1] rounded-md overflow-hidden bg-bg-elevated">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="サムネイル" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 bg-white/20 text-white text-xs rounded backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors"
          >
            変更
          </button>
          <button
            onClick={onRemove}
            className="px-4 py-2 bg-white/20 text-white text-xs rounded backdrop-blur-sm cursor-pointer hover:bg-red-500/50 transition-colors"
          >
            削除
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full border-2 border-dashed border-border rounded-md p-6 text-center hover:border-border-gold transition-all cursor-pointer group"
      >
        <div className="text-2xl mb-2 opacity-40 group-hover:opacity-70 transition-opacity">
          {uploading ? "⏳" : "🖼️"}
        </div>
        <div className="text-xs text-text-muted group-hover:text-text-secondary transition-colors">
          {uploading ? "アップロード中..." : "サムネイル画像を追加（クリックして選択）"}
        </div>
        <div className="text-[10px] text-text-muted mt-1">JPG, PNG, WebP（最大5MB）</div>
      </button>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
    </div>
  );
}

// ── リッチテキストエディター（WordPress風） ──
function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // テキストエリアに書式を挿入
  const insertFormat = useCallback((before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const newText = value.substring(0, start) + before + selected + after + value.substring(end);
    onChange(newText);

    // カーソル位置を調整
    setTimeout(() => {
      textarea.focus();
      const newPos = selected ? start + before.length + selected.length + after.length : start + before.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }, [value, onChange]);

  // ツールバーボタン定義
  const tools = [
    { icon: "H2", title: "見出し", action: () => insertFormat("\n## ", "\n") },
    { icon: "H3", title: "小見出し", action: () => insertFormat("\n### ", "\n") },
    { icon: "B", title: "太字", action: () => insertFormat("**", "**") },
    { icon: "—", title: "区切り線", action: () => insertFormat("\n---\n") },
    { icon: "•", title: "箇条書き", action: () => insertFormat("\n- ") },
    { icon: "1.", title: "番号付きリスト", action: () => insertFormat("\n1. ") },
    { icon: "❝", title: "引用", action: () => insertFormat("\n> ") },
    { icon: "🔗", title: "リンク", action: () => insertFormat("[", "](URL)") },
    { icon: "¶", title: "段落区切り", action: () => insertFormat("\n\n") },
  ];

  // テキストエリアの高さを自動調整
  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.max(400, textarea.scrollHeight) + "px";
  }, []);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  return (
    <div className="border border-border rounded-md overflow-hidden bg-bg-secondary">
      {/* ツールバー */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border bg-bg-tertiary overflow-x-auto">
        {tools.map((tool, i) => (
          <button
            key={i}
            type="button"
            onClick={tool.action}
            title={tool.title}
            className="px-2.5 py-1.5 text-xs text-text-secondary hover:text-gold hover:bg-gold/5 rounded transition-all cursor-pointer shrink-0 font-mono"
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* テキストエリア */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          autoResize();
        }}
        placeholder="記事の本文を入力してください...&#10;&#10;段落は空行で区切ります。&#10;## で見出し、**太字** などが使えます。"
        className="w-full px-5 py-4 bg-transparent text-text-primary text-sm outline-none resize-none leading-[2] min-h-[400px] placeholder:text-text-muted/40"
      />

      {/* ステータスバー */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-border text-[10px] text-text-muted">
        <span>{value.length} 文字</span>
        <span>段落は空行で区切り ・ ## で見出し ・ **太字**</span>
      </div>
    </div>
  );
}
