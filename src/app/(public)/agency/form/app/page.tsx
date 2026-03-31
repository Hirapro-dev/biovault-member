"use client";

import { useState } from "react";
import GoldDivider from "@/components/ui/GoldDivider";

export default function AgencyApplyPage() {
  const [form, setForm] = useState({
    companyName: "", representativeName: "", nameKana: "", email: "", phone: "",
    postalCode: "", address: "", occupation: "", motivation: "", experience: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/agency/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const d = await res.json(); setError(d.error || "送信に失敗しました"); }
      else setDone(true);
    } catch { setError("エラーが発生しました"); }
    finally { setSubmitting(false); }
  };

  if (done) {
    return (
      <Wrapper>
        <div className="text-center py-16">
          <div className="text-5xl mb-6">✓</div>
          <h2 className="font-serif-jp text-xl text-gold mb-3">お申込みを受け付けました</h2>
          <p className="text-sm text-text-secondary leading-relaxed max-w-md mx-auto">担当者より改めてご連絡させていただきます。</p>
        </div>
      </Wrapper>
    );
  }

  const ic = "w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold";

  return (
    <Wrapper>
      <div className="text-center mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="BioVault" className="h-8 w-auto mx-auto mb-4" />
        <h1 className="font-serif-jp text-lg sm:text-xl text-text-primary tracking-[2px] mb-2">BioVault 代理店 申込書</h1>
        <GoldDivider width={60} className="mx-auto mb-3" />
        <p className="text-xs text-text-muted text-left sm:text-center leading-relaxed max-w-lg mx-auto">BioVaultメンバーシップサービスの販売協力業務に関する代理店契約のお申込みです。</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-bg-secondary border border-border rounded-md p-5 sm:p-7">
        {error && <div className="mb-4 p-3 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-xs text-center">{error}</div>}

        <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-5 pb-3 border-b border-border">申込者情報</h3>

        <div className="mb-5">
          <label className="block text-xs text-text-secondary tracking-wider mb-2">法人名（個人の場合は空欄）</label>
          <input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="株式会社◯◯" className={ic} />
        </div>
        <div className="mb-5">
          <label className="block text-xs text-text-secondary tracking-wider mb-2">代表者名 / 氏名 <span className="text-status-danger">*</span></label>
          <input value={form.representativeName} onChange={(e) => update("representativeName", e.target.value)} placeholder="山田 太郎" required className={ic} />
          <div className="text-[10px] text-text-muted mt-1">※ 姓と名の間にスペースを入れてください</div>
        </div>
        <div className="mb-5">
          <label className="block text-xs text-text-secondary tracking-wider mb-2">フリガナ <span className="text-status-danger">*</span></label>
          <input value={form.nameKana} onChange={(e) => {
            const converted = e.target.value.replace(/[\u3041-\u3096]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
            update("nameKana", converted);
          }} placeholder="ヤマダ タロウ" required className={ic} />
        </div>
        <div className="mb-5">
          <label className="block text-xs text-text-secondary tracking-wider mb-2">メールアドレス <span className="text-status-danger">*</span></label>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="your@email.com" required className={ic} />
        </div>
        <div className="mb-5">
          <label className="block text-xs text-text-secondary tracking-wider mb-2">電話番号（ハイフンなし） <span className="text-status-danger">*</span></label>
          <input type="tel" inputMode="numeric" value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/[^0-9]/g, ""))} placeholder="09012345678" required maxLength={11} className={ic + " font-mono"} />
        </div>
        <div className="mb-5">
          <label className="block text-xs text-text-secondary tracking-wider mb-2">住所 <span className="text-status-danger">*</span></label>
          <input value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="東京都港区..." required className={ic} />
        </div>

        <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-5 pb-3 border-b border-border mt-6">その他</h3>

        <div className="mb-5">
          <label className="block text-xs text-text-secondary tracking-wider mb-2">営業経験</label>
          <textarea value={form.experience} onChange={(e) => update("experience", e.target.value)} placeholder="これまでの営業経験があればご記入ください" rows={3} className={ic + " resize-none"} />
        </div>
        <div className="mb-5">
          <label className="block text-xs text-text-secondary tracking-wider mb-2">申込動機</label>
          <textarea value={form.motivation} onChange={(e) => update("motivation", e.target.value)} placeholder="申込みの動機をご記入ください" rows={3} className={ic + " resize-none"} />
        </div>

        <button type="submit" disabled={submitting} className="w-full mt-2 py-3.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-sm font-semibold tracking-wider cursor-pointer transition-all hover:opacity-90 disabled:opacity-50">
          {submitting ? "送信中..." : "申込みを送信する"}
        </button>
      </form>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-bg-primary text-text-primary font-sans"><div className="max-w-lg mx-auto px-4 py-10 sm:py-16">{children}</div></div>;
}
