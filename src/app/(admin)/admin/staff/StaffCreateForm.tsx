"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StaffCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [nameKana, setNameKana] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), nameKana: nameKana.trim(), email: email.trim() }),
      });
      if (res.ok) {
        setName("");
        setNameKana("");
        setEmail("");
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
          + 新規作成
        </button>
      ) : (
        <div className="bg-bg-secondary border border-border-gold rounded-md p-5">
          <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">従業員を登録</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[11px] text-text-muted mb-1">氏名 <span className="text-status-danger">*</span></label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="田中 太郎" className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">フリガナ</label>
              <input value={nameKana} onChange={(e) => setNameKana(e.target.value)} placeholder="タナカ タロウ" className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">メール</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tanaka@example.com" className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="px-4 py-2 bg-transparent border border-border text-text-secondary rounded-sm text-xs cursor-pointer hover:border-border-gold transition-all">
              キャンセル
            </button>
            <button onClick={handleSubmit} disabled={submitting || !name.trim()} className="px-4 py-2 bg-gold-gradient border-none rounded-sm text-bg-primary text-xs font-semibold cursor-pointer hover:opacity-90 transition-all disabled:opacity-50">
              {submitting ? "作成中..." : "登録する"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
