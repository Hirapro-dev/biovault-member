"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SchemeKey } from "@/lib/scheme";

// 口座種別の選択肢
const ACCOUNT_TYPES = ["普通", "当座"];

// 使用スキームの選択肢（株式会社SCPP / 株式会社MRT）
const SCHEME_OPTIONS: { value: SchemeKey; label: string }[] = [
  { value: "SCPP", label: "株式会社SCPP" },
  { value: "MRT", label: "株式会社MRT" },
];

// ────────────────────────────────────────
// 新規作成フォーム
// ────────────────────────────────────────
export function BankAccountForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [accountType, setAccountType] = useState("普通");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [scheme, setScheme] = useState<SchemeKey>("SCPP");

  const handleSubmit = async () => {
    if (!bankName.trim() || !branchName.trim() || !accountNumber.trim() || !accountName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: bankName.trim(),
          branchName: branchName.trim(),
          accountType,
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
          scheme,
        }),
      });
      if (res.ok) {
        setBankName("");
        setBranchName("");
        setAccountType("普通");
        setAccountNumber("");
        setAccountName("");
        setScheme("SCPP");
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
          <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">振込先口座を登録</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[11px] text-text-muted mb-1">銀行名 <span className="text-status-danger">*</span></label>
              <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="三菱UFJ銀行" className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">支店名 <span className="text-status-danger">*</span></label>
              <input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="渋谷支店" className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">口座種別 <span className="text-status-danger">*</span></label>
              <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold">
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">口座番号 <span className="text-status-danger">*</span></label>
              <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="1234567" className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">口座名義 <span className="text-status-danger">*</span></label>
              <input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="カ)バイオボルト" className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">使用スキーム <span className="text-status-danger">*</span></label>
              <select value={scheme} onChange={(e) => setScheme(e.target.value as SchemeKey)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold">
                {SCHEME_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-text-muted mt-1">このスキームで登録された会員のみに表示されます</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="px-4 py-2 bg-transparent border border-border text-text-secondary rounded-sm text-xs cursor-pointer hover:border-border-gold transition-all">
              キャンセル
            </button>
            <button onClick={handleSubmit} disabled={submitting || !bankName.trim() || !branchName.trim() || !accountNumber.trim() || !accountName.trim()} className="px-4 py-2 bg-gold-gradient border-none rounded-sm text-bg-primary text-xs font-semibold cursor-pointer hover:opacity-90 transition-all disabled:opacity-50">
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
interface BankAccount {
  id: string;
  bankName: string;
  branchName: string;
  accountType: string;
  accountNumber: string;
  accountName: string;
  isActive: boolean;
  scheme: SchemeKey;
}

export function BankAccountEditButton({ account }: { account: BankAccount }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bankName, setBankName] = useState(account.bankName);
  const [branchName, setBranchName] = useState(account.branchName);
  const [accountType, setAccountType] = useState(account.accountType);
  const [accountNumber, setAccountNumber] = useState(account.accountNumber);
  const [accountName, setAccountName] = useState(account.accountName);
  const [scheme, setScheme] = useState<SchemeKey>(account.scheme);

  const handleUpdate = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/bank-accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: bankName.trim(),
          branchName: branchName.trim(),
          accountType,
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
          scheme,
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
            <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">振込先口座を編集</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[11px] text-text-muted mb-1">銀行名</label>
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
              </div>
              <div>
                <label className="block text-[11px] text-text-muted mb-1">支店名</label>
                <input value={branchName} onChange={(e) => setBranchName(e.target.value)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
              </div>
              <div>
                <label className="block text-[11px] text-text-muted mb-1">口座種別</label>
                <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold">
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-text-muted mb-1">口座番号</label>
                <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
              </div>
              <div>
                <label className="block text-[11px] text-text-muted mb-1">口座名義</label>
                <input value={accountName} onChange={(e) => setAccountName(e.target.value)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold" />
              </div>
              <div>
                <label className="block text-[11px] text-text-muted mb-1">使用スキーム</label>
                <select value={scheme} onChange={(e) => setScheme(e.target.value as SchemeKey)} className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-sm text-text-primary outline-none focus:border-border-gold">
                  {SCHEME_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 bg-transparent border border-border text-text-secondary rounded-sm text-xs cursor-pointer hover:border-border-gold transition-all">
                キャンセル
              </button>
              <button onClick={handleUpdate} disabled={submitting} className="px-4 py-2 bg-gold-gradient border-none rounded-sm text-bg-primary text-xs font-semibold cursor-pointer hover:opacity-90 transition-all disabled:opacity-50">
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
export function BankAccountDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("この振込先口座を無効にしますか？")) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/bank-accounts/${id}`, { method: "DELETE" });
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
