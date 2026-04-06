"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// カテゴリの選択肢
const CATEGORIES = [
  { value: "basic", label: "基礎用語" },
  { value: "medical", label: "医療応用" },
  { value: "biovault", label: "BioVault関連" },
];

// カテゴリラベル取得
export function getCategoryLabel(category: string) {
  return CATEGORIES.find((c) => c.value === category)?.label || category;
}

// ────────────────────────────────────────
// 新規作成フォーム
// ────────────────────────────────────────
export function GlossaryForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [term, setTerm] = useState("");
  const [reading, setReading] = useState("");
  const [english, setEnglish] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("basic");
  const [sortOrder, setSortOrder] = useState(0);

  const handleSubmit = async () => {
    if (!term.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/glossary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: term.trim(),
          reading: reading.trim(),
          english: english.trim(),
          description: description.trim(),
          category,
          sortOrder,
        }),
      });
      if (res.ok) {
        setTerm("");
        setReading("");
        setEnglish("");
        setDescription("");
        setCategory("basic");
        setSortOrder(0);
        setOpen(false);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-5">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="px-4 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-sm font-semibold tracking-wider cursor-pointer hover:opacity-90 transition-all"
        >
          + 新規登録
        </button>
      ) : (
        <div className="bg-bg-secondary border border-border-gold rounded-md p-5">
          <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">用語を登録</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[11px] text-text-muted mb-1">用語名 <span className="text-status-danger">*</span></label>
              <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="iPS細胞" className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">読み</label>
              <input value={reading} onChange={(e) => setReading(e.target.value)} placeholder="アイピーエスサイボウ" className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">英語名</label>
              <input value={english} onChange={(e) => setEnglish(e.target.value)} placeholder="induced pluripotent stem cells" className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">カテゴリ</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold">
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">表示順</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-text-muted mb-1">説明 <span className="text-status-danger">*</span></label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="用語の説明文..." className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold resize-y" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="px-4 py-2 bg-transparent border border-border text-text-secondary rounded-sm text-xs cursor-pointer hover:border-border-gold transition-all">
              キャンセル
            </button>
            <button onClick={handleSubmit} disabled={submitting || !term.trim() || !description.trim()} className="px-4 py-2 bg-gold-gradient border-none rounded-sm text-bg-primary text-xs font-semibold cursor-pointer hover:opacity-90 transition-all disabled:opacity-50">
              {submitting ? "作成中..." : "登録する"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────
// 編集モーダル
// ────────────────────────────────────────
interface GlossaryTerm {
  id: string;
  term: string;
  reading: string | null;
  english: string | null;
  description: string;
  category: string;
  sortOrder: number;
}

export function GlossaryEditButton({ glossaryTerm }: { glossaryTerm: GlossaryTerm }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [term, setTerm] = useState(glossaryTerm.term);
  const [reading, setReading] = useState(glossaryTerm.reading || "");
  const [english, setEnglish] = useState(glossaryTerm.english || "");
  const [description, setDescription] = useState(glossaryTerm.description);
  const [category, setCategory] = useState(glossaryTerm.category);
  const [sortOrder, setSortOrder] = useState(glossaryTerm.sortOrder);

  const handleUpdate = async () => {
    if (!term.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/glossary/${glossaryTerm.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: term.trim(),
          reading: reading.trim(),
          english: english.trim(),
          description: description.trim(),
          category,
          sortOrder,
        }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="px-3 py-1 bg-transparent border border-border text-text-secondary rounded-sm text-[11px] hover:border-border-gold hover:text-gold transition-all">
        編集
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-bg-secondary border border-border-gold rounded-md p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">用語を編集</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[11px] text-text-muted mb-1">用語名</label>
                <input value={term} onChange={(e) => setTerm(e.target.value)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
              </div>
              <div>
                <label className="block text-[11px] text-text-muted mb-1">読み</label>
                <input value={reading} onChange={(e) => setReading(e.target.value)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
              </div>
              <div>
                <label className="block text-[11px] text-text-muted mb-1">英語名</label>
                <input value={english} onChange={(e) => setEnglish(e.target.value)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
              </div>
              <div>
                <label className="block text-[11px] text-text-muted mb-1">カテゴリ</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold">
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-text-muted mb-1">表示順</label>
                <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-text-muted mb-1">説明</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold resize-y" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 bg-transparent border border-border text-text-secondary rounded-sm text-xs cursor-pointer hover:border-border-gold transition-all">
                キャンセル
              </button>
              <button onClick={handleUpdate} disabled={submitting || !term.trim() || !description.trim()} className="px-4 py-2 bg-gold-gradient border-none rounded-sm text-bg-primary text-xs font-semibold cursor-pointer hover:opacity-90 transition-all disabled:opacity-50">
                {submitting ? "更新中..." : "更新する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ────────────────────────────────────────
// 削除ボタン（物理削除）
// ────────────────────────────────────────
export function GlossaryDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("この用語を削除しますか？この操作は取り消せません。")) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/glossary/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button onClick={handleDelete} disabled={submitting} className="px-3 py-1 bg-transparent border border-status-danger/30 text-status-danger rounded-sm text-[11px] hover:bg-status-danger/10 transition-all disabled:opacity-50">
      {submitting ? "処理中..." : "削除"}
    </button>
  );
}

// ────────────────────────────────────────
// カテゴリバッジ
// ────────────────────────────────────────
const CATEGORY_STYLES: Record<string, string> = {
  basic: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  medical: "bg-green-500/10 text-green-400 border-green-500/20",
  biovault: "bg-gold/10 text-gold border-gold/20",
};

export function CategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_STYLES[category] || "bg-text-muted/10 text-text-muted border-text-muted/20";
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${style}`}>
      {getCategoryLabel(category)}
    </span>
  );
}
