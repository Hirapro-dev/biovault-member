"use client";

// 紹介協力者ポータルのクライアント部品（URLコピー・口座登録・パスワード変更）
import { useState } from "react";

// ── 専用URLコピー ──
export function CopyLpUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="flex-1 min-w-[200px] bg-bg-primary border border-border rounded px-3 py-2.5 text-[12px] text-gold break-all">
        {url}
      </code>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="px-4 py-2.5 rounded bg-gold/90 text-bg-primary text-[13px] font-bold hover:bg-gold transition-colors"
      >
        {copied ? "コピーしました ✓" : "URLをコピー"}
      </button>
    </div>
  );
}

// ── 振込先口座フォーム ──
export function BankAccountForm({
  initial,
}: {
  initial: {
    bankName: string;
    bankBranch: string;
    bankAccountType: string;
    bankAccountNumber: string;
    bankAccountName: string;
  };
}) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/affiliate/bank-account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setMessage(res.ok ? "振込先を保存しました" : data.error || "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full bg-bg-primary border border-border rounded px-3 py-2 text-[13px] text-text-primary";
  const label = "text-[11px] text-text-muted mb-1 block";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <span className={label}>銀行名</span>
        <input value={form.bankName} onChange={set("bankName")} placeholder="〇〇銀行" className={input} />
      </div>
      <div>
        <span className={label}>支店名</span>
        <input value={form.bankBranch} onChange={set("bankBranch")} placeholder="〇〇支店" className={input} />
      </div>
      <div>
        <span className={label}>口座種別</span>
        <select value={form.bankAccountType} onChange={set("bankAccountType")} className={input}>
          <option value="">選択してください</option>
          <option value="普通">普通</option>
          <option value="当座">当座</option>
        </select>
      </div>
      <div>
        <span className={label}>口座番号</span>
        <input value={form.bankAccountNumber} onChange={set("bankAccountNumber")} placeholder="1234567" className={input} />
      </div>
      <div className="sm:col-span-2">
        <span className={label}>口座名義（カナ）</span>
        <input value={form.bankAccountName} onChange={set("bankAccountName")} placeholder="ヤマダ タロウ" className={input} />
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 rounded bg-gold/90 text-bg-primary text-[13px] font-bold hover:bg-gold transition-colors disabled:opacity-50"
        >
          {saving ? "保存中…" : "振込先を保存"}
        </button>
        {message && <span className="text-[12px] text-gold">{message}</span>}
      </div>
    </div>
  );
}

// ── パスワード変更フォーム ──
export function PasswordChangeForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const save = async () => {
    if (next.length < 8) {
      setMessage("新しいパスワードは8文字以上で入力してください");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("パスワードを変更しました");
        setCurrent("");
        setNext("");
      } else {
        setMessage(data.error || "変更に失敗しました");
      }
    } finally {
      setSaving(false);
    }
  };

  const input = "w-full bg-bg-primary border border-border rounded px-3 py-2 text-[13px] text-text-primary";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <span className="text-[11px] text-text-muted mb-1 block">現在のパスワード</span>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className={input} />
      </div>
      <div>
        <span className="text-[11px] text-text-muted mb-1 block">新しいパスワード（8文字以上）</span>
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className={input} />
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || !current || !next}
          className="px-5 py-2 rounded border border-border text-[13px] text-text-primary hover:border-gold transition-colors disabled:opacity-50"
        >
          {saving ? "変更中…" : "パスワードを変更"}
        </button>
        {message && <span className="text-[12px] text-gold">{message}</span>}
      </div>
    </div>
  );
}
