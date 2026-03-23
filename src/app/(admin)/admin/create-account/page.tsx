"use client";

import { useState } from "react";

export default function CreateAccountPage() {
  const [form, setForm] = useState({
    name: "",
    nameKana: "",
    email: "",
    phone: "",
    referrerName: "",
  });
  const [result, setResult] = useState<{
    memberNumber: string;
    tempPassword: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "アカウント発行に失敗しました");
      } else {
        setResult({
          memberNumber: data.memberNumber,
          tempPassword: data.tempPassword,
        });
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", nameKana: "", email: "", phone: "", referrerName: "" });
    setResult(null);
    setError("");
  };

  return (
    <div>
      <h2 className="font-serif-jp text-[22px] font-normal text-text-primary tracking-[2px] mb-7">
        アカウント発行
      </h2>

      {result ? (
        <div className="bg-bg-secondary border border-border-gold rounded-md p-10 text-center max-w-[560px]">
          <div className="text-[40px] mb-4">✓</div>
          <h3 className="font-serif-jp text-xl text-gold mb-2">
            アカウントを発行しました
          </h3>
          <p className="text-[13px] text-text-secondary mb-6">
            会員番号{" "}
            <span className="font-mono text-gold">{result.memberNumber}</span>{" "}
            で登録しました
          </p>

          <div className="bg-bg-elevated border border-border rounded-md p-4 mb-6 text-left">
            <div className="text-[11px] text-text-muted mb-2">仮パスワード（メール送信に使用）</div>
            <div className="font-mono text-sm text-gold tracking-wider">
              {result.tempPassword}
            </div>
          </div>

          <button
            onClick={resetForm}
            className="px-7 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer transition-all duration-300 hover:opacity-90"
          >
            続けて発行
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-bg-secondary border border-border rounded-md p-8 max-w-[560px]"
        >
          {error && (
            <div className="mb-4 p-3 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-xs">
              {error}
            </div>
          )}

          <FormField label="氏名" required>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="田中 太郎"
              required
              className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
            />
          </FormField>

          <FormField label="フリガナ">
            <input
              value={form.nameKana}
              onChange={(e) => setForm({ ...form, nameKana: e.target.value })}
              placeholder="タナカ タロウ"
              className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
            />
          </FormField>

          <FormField label="メールアドレス" required>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="tanaka@example.com"
              required
              className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
            />
          </FormField>

          <FormField label="電話番号">
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="090-0000-0000"
              className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
            />
          </FormField>

          <FormField label="契約プラン">
            <div className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm">
              基本パッケージ（880万円）
            </div>
          </FormField>

          <FormField label="紹介者名（任意）">
            <input
              value={form.referrerName}
              onChange={(e) => setForm({ ...form, referrerName: e.target.value })}
              placeholder=""
              className="w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold"
            />
          </FormField>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer transition-all duration-300 hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "発行中..." : "アカウントを発行してメール送信"}
          </button>
        </form>
      )}
    </div>
  );
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <label className="block text-[11px] text-text-secondary tracking-[2px] mb-2">
        {label}
        {required && <span className="text-status-danger ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
