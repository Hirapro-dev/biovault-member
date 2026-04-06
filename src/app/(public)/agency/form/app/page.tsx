"use client";

import { useState, useRef } from "react";
import GoldDivider from "@/components/ui/GoldDivider";

export default function AgencyApplyPage() {
  const [form, setForm] = useState({
    companyName: "",
    representativeName: "",
    nameKana: "",
    email: "",
    phone: "",
    postalCode: "",
    address: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/agency/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "送信に失敗しました");
      } else {
        setDone(true);
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Wrapper>
        <div className="text-center py-16">
          <div className="text-5xl mb-6">✔️</div>
          <h2 className="font-serif-jp text-xl text-gold mb-3">エージェント登録を受け付けました</h2>
          <p className="text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
            担当者より改めてログイン情報をご連絡させていただきます。
          </p>
        </div>
      </Wrapper>
    );
  }

  const ic = "w-full px-4 py-3 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none transition-colors duration-300 focus:border-border-gold";

  return (
    <Wrapper>
      <div className="text-center mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="BioVault" className="h-10 w-auto mx-auto mb-4" />
        <h1 className="font-serif-jp text-lg sm:text-xl text-text-primary tracking-[2px] mb-2">
          BioVault エージェント登録
        </h1>
        <GoldDivider width={60} className="mx-auto mb-3" />
        <p className="text-xs text-text-muted text-left sm:text-center leading-relaxed max-w-lg mx-auto">
          BioVaultメンバーシップサービスの販売協力パートナーとしてご登録ください。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-bg-secondary border border-border rounded-md p-5 sm:p-7">
        {error && (
          <div className="mb-4 p-3 bg-status-danger/10 border border-status-danger/20 rounded text-status-danger text-xs text-center">
            {error}
          </div>
        )}

        <div className="mb-5">
          <label className="block text-xs text-text-secondary tracking-wider mb-2">
            法人名・屋号名 <span className="text-text-muted">（個人の場合は空欄）</span>
          </label>
          <input
            value={form.companyName}
            onChange={(e) => update("companyName", e.target.value)}
            placeholder="株式会社◯◯"
            className={ic}
          />
        </div>

        <div className="mb-5">
          <label className="block text-xs text-text-secondary tracking-wider mb-2">
            代表者名 / 氏名 <span className="text-status-danger">*</span>
          </label>
          <AgencyNameInput
            value={form.representativeName}
            onChange={(v) => update("representativeName", v)}
            onKana={(v) => update("nameKana", v)}
            className={ic}
          />
          <div className="text-[10px] text-text-muted mt-1">※ 姓と名の間にスペースを入れてください</div>
        </div>

        <div className="mb-5">
          <label className="block text-xs text-text-secondary tracking-wider mb-2">
            フリガナ（自動入力） <span className="text-status-danger">*</span>
          </label>
          <input
            value={form.nameKana}
            onChange={(e) => {
              const converted = e.target.value.replace(/[\u3041-\u3096]/g, (ch) =>
                String.fromCharCode(ch.charCodeAt(0) + 0x60)
              );
              update("nameKana", converted);
            }}
            placeholder="ヤマダ タロウ"
            required
            className={ic}
          />
          <div className="text-[10px] text-text-muted mt-1">ひらがなで入力するとカタカナに自動変換されます</div>
        </div>

        <div className="mb-5">
          <label className="block text-xs text-text-secondary tracking-wider mb-2">
            メールアドレス <span className="text-status-danger">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="your@email.com"
            required
            className={ic}
          />
        </div>

        <div className="mb-5">
          <label className="block text-xs text-text-secondary tracking-wider mb-2">
            電話番号（ハイフンなし） <span className="text-status-danger">*</span>
          </label>
          <input
            type="tel"
            inputMode="numeric"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="09012345678"
            required
            maxLength={11}
            className={ic + " font-mono tracking-wider"}
          />
        </div>

        <div className="mb-5">
          <label className="block text-xs text-text-secondary tracking-wider mb-2">郵便番号</label>
          <AgencyPostalCode
            value={form.postalCode}
            onChange={(v) => update("postalCode", v)}
            onAddress={(v) => update("address", v)}
            className={ic}
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs text-text-secondary tracking-wider mb-2">
            住所 <span className="text-status-danger">*</span>
          </label>
          <input
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            placeholder="東京都港区..."
            required
            className={ic}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-sm font-semibold tracking-wider cursor-pointer transition-all hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "送信中..." : "エージェント登録を申請する"}
        </button>
      </form>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans">
      <div className="max-w-lg mx-auto px-4 py-10 sm:py-16">{children}</div>
    </div>
  );
}

// ── 氏名入力（IME compositionupdate でひらがな取得→カタカナ変換） ──
function AgencyNameInput({ value, onChange, onKana, className }: { value: string; onChange: (v: string) => void; onKana: (v: string) => void; className: string }) {
  const confirmedKana = useRef("");
  const lastCompositionData = useRef("");
  const isComposing = useRef(false);

  const handleCompositionStart = () => { isComposing.current = true; lastCompositionData.current = ""; };

  const handleCompositionUpdate = (e: React.CompositionEvent<HTMLInputElement>) => {
    if (e.data) {
      const hasHiragana = /[\u3041-\u3096]/.test(e.data);
      if (hasHiragana) {
        lastCompositionData.current = e.data.replace(/[\u3041-\u3096]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
      }
    }
  };

  const handleCompositionEnd = () => {
    isComposing.current = false;
    if (lastCompositionData.current) {
      confirmedKana.current += lastCompositionData.current;
      lastCompositionData.current = "";
      onKana(confirmedKana.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isComposing.current) {
      if (e.key === " " || e.key === "　") { confirmedKana.current += " "; onKana(confirmedKana.current); }
      if (e.key === "Backspace") { confirmedKana.current = confirmedKana.current.slice(0, -1); onKana(confirmedKana.current); }
    }
  };

  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onCompositionStart={handleCompositionStart}
      onCompositionUpdate={handleCompositionUpdate}
      onCompositionEnd={handleCompositionEnd}
      onKeyDown={handleKeyDown}
      placeholder="山田 太郎"
      required
      className={className}
    />
  );
}

// ── 郵便番号入力（自動住所検索） ──
function AgencyPostalCode({ value, onChange, onAddress, className }: { value: string; onChange: (v: string) => void; onAddress: (v: string) => void; className: string }) {
  const [searching, setSearching] = useState(false);

  const handleChange = async (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "").slice(0, 7);
    let formatted = digits;
    if (digits.length > 3) formatted = digits.slice(0, 3) + "-" + digits.slice(3);
    onChange(formatted);

    if (digits.length === 7) {
      setSearching(true);
      try {
        const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const r = data.results[0];
          onAddress(`${r.address1}${r.address2}${r.address3}`);
        }
      } catch {} finally { setSearching(false); }
    }
  };

  return (
    <div className="relative">
      <input inputMode="numeric" value={value} onChange={(e) => handleChange(e.target.value)} placeholder="000-0000" maxLength={8} className={className + " font-mono"} />
      {searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-text-muted">検索中...</span>}
    </div>
  );
}
