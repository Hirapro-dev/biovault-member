"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StaffKarteActions({
  staffId,
  currentStaffCode,
  currentName,
  currentNameKana,
  currentEmail,
  currentNote,
  isActive,
  isSuperAdmin = false,
}: {
  staffId: string;
  currentStaffCode: string;
  currentName: string;
  currentNameKana: string;
  currentEmail: string;
  currentNote: string;
  isActive: boolean;
  isSuperAdmin?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [staffCode, setStaffCode] = useState(currentStaffCode);
  const [name, setName] = useState(currentName);
  const [nameKana, setNameKana] = useState(currentNameKana);
  const [email, setEmail] = useState(currentEmail);
  const [note, setNote] = useState(currentNote);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        nameKana: nameKana.trim(),
        email: email.trim(),
        note: note.trim(),
      };
      // 従業員コードの変更は SUPER_ADMIN のみ送信
      if (isSuperAdmin) payload.staffCode = staffCode.trim();

      const res = await fetch(`/api/admin/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "更新に失敗しました");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("エラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider">情報編集</h3>
        <div className="flex gap-2">
          <button
            onClick={handleToggleActive}
            disabled={saving}
            className={`px-3 py-1 border rounded-sm text-[11px] cursor-pointer transition-all disabled:opacity-50 ${
              isActive
                ? "border-status-danger/30 text-status-danger hover:bg-status-danger/10"
                : "border-status-active/30 text-status-active hover:bg-status-active/10"
            }`}
          >
            {isActive ? "無効にする" : "有効にする"}
          </button>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-3 py-1 bg-transparent border border-border text-text-secondary rounded-sm text-[11px] cursor-pointer hover:border-border-gold hover:text-gold transition-all"
            >
              編集
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          {error && (
            <div className="p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-[11px]">{error}</div>
          )}
          {isSuperAdmin && (
            <div>
              <label className="block text-[11px] text-text-muted mb-1">
                従業員コード <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/20">全権限者のみ</span>
              </label>
              <input
                value={staffCode}
                onChange={(e) => setStaffCode(e.target.value.toUpperCase())}
                placeholder="ST-0001"
                className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary font-mono outline-none focus:border-border-gold"
              />
              <p className="text-[9px] text-text-muted mt-1">空き番号への変更可。変更すると、この従業員を担当に持つ会員・代理店の参照も自動で追従します。</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-text-muted mb-1">氏名 <span className="text-status-danger">*</span></label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">フリガナ</label>
              <input value={nameKana} onChange={(e) => setNameKana(e.target.value)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">メール</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-text-muted mb-1">備考</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold resize-none" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="px-4 py-2 bg-transparent border border-border text-text-secondary rounded-sm text-xs cursor-pointer hover:border-border-gold transition-all">
              キャンセル
            </button>
            <button onClick={handleSave} disabled={saving || !name.trim()} className="px-4 py-2 bg-gold-gradient border-none rounded-sm text-bg-primary text-xs font-semibold cursor-pointer hover:opacity-90 transition-all disabled:opacity-50">
              {saving ? "保存中..." : "保存する"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-muted">「編集」ボタンから基本情報を変更できます</p>
      )}
    </div>
  );
}
