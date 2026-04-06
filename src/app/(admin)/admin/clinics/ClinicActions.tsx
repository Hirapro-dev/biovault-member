"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ────────────────────────────────────────
// 新規作成フォーム
// ────────────────────────────────────────
export function ClinicForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          note: note.trim(),
        }),
      });
      if (res.ok) {
        setName("");
        setAddress("");
        setPhone("");
        setNote("");
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
          <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">クリニックを登録</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[11px] text-text-muted mb-1">クリニック名 <span className="text-status-danger">*</span></label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="○○クリニック" className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">電話番号</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03-1234-5678" className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-text-muted mb-1">住所</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="東京都渋谷区..." className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] text-text-muted mb-1">備考</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="備考..." className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold resize-y" />
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

// ────────────────────────────────────────
// 編集モーダル
// ────────────────────────────────────────
interface Clinic {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  note: string | null;
  isActive: boolean;
}

export function ClinicEditButton({ clinic }: { clinic: Clinic }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(clinic.name);
  const [address, setAddress] = useState(clinic.address || "");
  const [phone, setPhone] = useState(clinic.phone || "");
  const [note, setNote] = useState(clinic.note || "");

  const handleUpdate = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/clinics/${clinic.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          phone: phone.trim(),
          note: note.trim(),
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
          <div className="bg-bg-secondary border border-border-gold rounded-md p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">クリニックを編集</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[11px] text-text-muted mb-1">クリニック名</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
              </div>
              <div>
                <label className="block text-[11px] text-text-muted mb-1">電話番号</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-text-muted mb-1">住所</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] text-text-muted mb-1">備考</label>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold resize-y" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 bg-transparent border border-border text-text-secondary rounded-sm text-xs cursor-pointer hover:border-border-gold transition-all">
                キャンセル
              </button>
              <button onClick={handleUpdate} disabled={submitting || !name.trim()} className="px-4 py-2 bg-gold-gradient border-none rounded-sm text-bg-primary text-xs font-semibold cursor-pointer hover:opacity-90 transition-all disabled:opacity-50">
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
// 削除ボタン（論理削除）
// ────────────────────────────────────────
export function ClinicDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("このクリニックを無効にしますか？")) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/clinics/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button onClick={handleDelete} disabled={submitting} className="px-3 py-1 bg-transparent border border-status-danger/30 text-status-danger rounded-sm text-[11px] hover:bg-status-danger/10 transition-all disabled:opacity-50">
      {submitting ? "処理中..." : "無効化"}
    </button>
  );
}
