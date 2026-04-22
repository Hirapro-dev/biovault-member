"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  initial: {
    bankName: string;
    bankBranch: string;
    bankAccountType: string;
    bankAccountNumber: string;
    bankAccountName: string;
  };
};

export default function BankAccountEditor({ initial }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSave = async () => {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/agency/bank-account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "更新に失敗しました");
      } else {
        setMessage("振込先情報を更新しました");
        setEditing(false);
        router.refresh();
        setTimeout(() => setMessage(""), 2000);
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm(initial);
    setEditing(false);
    setError("");
    setMessage("");
  };

  if (!editing) {
    return (
      <>
        {message && (
          <div className="mb-3 p-2 bg-status-active/10 border border-status-active/20 rounded text-status-active text-[11px]">
            {message}
          </div>
        )}
        <Row label="銀行名" value={initial.bankName || "未登録"} />
        <Row label="支店名" value={initial.bankBranch || "未登録"} />
        <Row label="口座種別" value={initial.bankAccountType || "未登録"} />
        <Row label="口座番号" value={initial.bankAccountNumber || "未登録"} />
        <Row label="口座名義" value={initial.bankAccountName || "未登録"} />
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 border border-border-gold text-gold rounded-sm text-xs tracking-wider hover:bg-gold/10 transition-all cursor-pointer"
          >
            振込先を編集
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-2 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-[11px]">
          {error}
        </div>
      )}
      <Field label="銀行名" value={form.bankName} placeholder="例: みずほ銀行" onChange={(v) => setForm(f => ({ ...f, bankName: v }))} />
      <Field label="支店名" value={form.bankBranch} placeholder="例: 渋谷支店" onChange={(v) => setForm(f => ({ ...f, bankBranch: v }))} />
      <div>
        <label className="block text-[11px] text-text-muted mb-1">口座種別</label>
        <div className="flex gap-2">
          {["普通", "当座"].map((t) => (
            <label
              key={t}
              className={`flex-1 flex items-center justify-center py-2 rounded-sm border cursor-pointer transition-all text-xs ${
                form.bankAccountType === t
                  ? "border-gold bg-gold/10 text-gold font-semibold"
                  : "border-border text-text-muted hover:border-border-gold"
              }`}
            >
              <input
                type="radio"
                name="bankAccountType"
                value={t}
                checked={form.bankAccountType === t}
                onChange={() => setForm(f => ({ ...f, bankAccountType: t }))}
                className="sr-only"
              />
              {t}
            </label>
          ))}
        </div>
      </div>
      <Field
        label="口座番号"
        value={form.bankAccountNumber}
        placeholder="7桁（数字のみ）"
        onChange={(v) => setForm(f => ({ ...f, bankAccountNumber: v.replace(/[^0-9]/g, "") }))}
        mono
        inputMode="numeric"
      />
      <Field label="口座名義" value={form.bankAccountName} placeholder="例: カ）テスト" onChange={(v) => setForm(f => ({ ...f, bankAccountName: v }))} />
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-4 py-2.5 border border-border text-text-secondary rounded-sm text-xs cursor-pointer hover:border-border-gold transition-all disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[12px] font-semibold tracking-wider cursor-pointer disabled:opacity-50"
        >
          {loading ? "更新中..." : "保存する"}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center py-2 border-b border-border last:border-b-0">
      <div className="w-24 text-[11px] text-text-muted shrink-0">{label}</div>
      <div className="text-xs text-text-primary">{value}</div>
    </div>
  );
}

function Field({
  label, value, placeholder, onChange, mono = false, inputMode,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  mono?: boolean;
  inputMode?: "numeric" | "text";
}) {
  return (
    <div>
      <label className="block text-[11px] text-text-muted mb-1">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        inputMode={inputMode}
        className={`w-full px-3 py-2 bg-bg-elevated border border-border rounded-sm text-text-primary text-xs outline-none focus:border-border-gold ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}
