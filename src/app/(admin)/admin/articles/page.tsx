"use client";

import { useState, useEffect } from "react";

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
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
    category: "NEWS",
    sourceUrl: "",
    sourceName: "",
    isPublished: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
      sourceUrl: "",
      sourceName: "",
      isPublished: false,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (article: Article) => {
    setForm({
      title: article.title,
      summary: article.summary,
      content: article.content,
      category: article.category,
      sourceUrl: article.sourceUrl || "",
      sourceName: article.sourceName || "",
      isPublished: article.isPublished,
    });
    setEditingId(article.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const url = editingId
        ? `/api/admin/articles/${editingId}`
        : "/api/admin/articles";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

  return (
    <div>
      <div className="flex justify-between items-center mb-7">
        <h2 className="font-serif-jp text-[22px] font-normal text-text-primary tracking-[2px]">
          iPS ニュース管理
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="px-5 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer transition-all duration-300 hover:opacity-90"
        >
          {showForm ? "✕ 閉じる" : "+ 新規記事"}
        </button>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-status-active/10 border border-status-active/20 rounded text-status-active text-xs">
          {message}
        </div>
      )}

      {/* 記事作成/編集フォーム */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-bg-secondary border border-border-gold rounded-md p-7 mb-8"
        >
          <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-5 pb-3 border-b border-border">
            {editingId ? "記事を編集" : "新規記事を作成"}
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] text-text-secondary tracking-[2px] mb-2">
                タイトル <span className="text-status-danger">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="記事タイトル"
                required
                className="w-full px-4 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors focus:border-border-gold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-secondary tracking-[2px] mb-2">
                カテゴリ <span className="text-status-danger">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[11px] text-text-secondary tracking-[2px] mb-2">
              要約（空欄時は本文の先頭200文字を使用）
            </label>
            <textarea
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="記事の要約を入力..."
              rows={2}
              className="w-full px-4 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none resize-none transition-colors focus:border-border-gold"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[11px] text-text-secondary tracking-[2px] mb-2">
              本文 <span className="text-status-danger">*</span>
              <span className="text-text-muted ml-2 normal-case">（段落は空行で区切ってください）</span>
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="記事の本文を入力..."
              required
              rows={12}
              className="w-full px-4 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none resize-y transition-colors focus:border-border-gold font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] text-text-secondary tracking-[2px] mb-2">
                出典名
              </label>
              <input
                value={form.sourceName}
                onChange={(e) => setForm({ ...form, sourceName: e.target.value })}
                placeholder="例: 京都大学, Nature"
                className="w-full px-4 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors focus:border-border-gold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-secondary tracking-[2px] mb-2">
                出典URL
              </label>
              <input
                value={form.sourceUrl}
                onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors focus:border-border-gold"
              />
            </div>
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
              className="px-8 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer transition-all duration-300 hover:opacity-90 disabled:opacity-50"
            >
              {saving
                ? "保存中..."
                : editingId
                ? "記事を更新"
                : "記事を作成"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2.5 bg-transparent border border-border text-text-secondary rounded-sm text-[13px] cursor-pointer hover:border-border-gold hover:text-gold transition-all"
            >
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* 記事一覧 */}
      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3.5 text-left text-[11px] text-text-muted tracking-wider font-normal">
                タイトル
              </th>
              <th className="px-5 py-3.5 text-left text-[11px] text-text-muted tracking-wider font-normal w-24">
                カテゴリ
              </th>
              <th className="px-5 py-3.5 text-left text-[11px] text-text-muted tracking-wider font-normal w-20">
                状態
              </th>
              <th className="px-5 py-3.5 text-left text-[11px] text-text-muted tracking-wider font-normal w-24">
                日付
              </th>
              <th className="px-5 py-3.5 text-left text-[11px] text-text-muted tracking-wider font-normal w-32">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-text-muted text-sm">
                  読み込み中...
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-text-muted text-sm">
                  記事がありません。「+ 新規記事」から作成してください。
                </td>
              </tr>
            ) : (
              articles.map((article) => (
                <tr
                  key={article.id}
                  className="border-b border-border hover:bg-bg-elevated transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div className="text-[13px] text-text-primary truncate max-w-[300px]">
                      {article.title}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
                      {CATEGORY_OPTIONS.find((c) => c.value === article.category)?.label || article.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => togglePublish(article)}
                      className={`text-[11px] px-2 py-0.5 rounded-full border cursor-pointer transition-all ${
                        article.isPublished
                          ? "bg-status-active/10 text-status-active border-status-active/20"
                          : "bg-text-muted/10 text-text-muted border-text-muted/20"
                      }`}
                    >
                      {article.isPublished ? "公開中" : "下書き"}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-[11px] text-text-muted font-mono">
                    {new Date(article.publishedAt).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(article)}
                        className="px-3 py-1 bg-transparent border border-border text-text-secondary rounded-sm text-[11px] cursor-pointer hover:border-border-gold hover:text-gold transition-all"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => deleteArticle(article.id)}
                        className="px-3 py-1 bg-transparent border border-border text-text-muted rounded-sm text-[11px] cursor-pointer hover:border-status-danger/50 hover:text-status-danger transition-all"
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
