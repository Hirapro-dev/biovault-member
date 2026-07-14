"use client";

/**
 * リード登録フォーム（LP経由の見込み顧客）
 * iPS適合確認フォーム(/form/app)の「1. 申請者情報」をベースに、
 * 生年月日は収集せず、代わりにご年収（プルダウン）を収集する。
 * (氏名/フリガナ自動抽出・郵便番号自動住所反映・メール重複チェック・職業選択・ご年収)
 */

import { useRef, useState } from "react";
import V2Wrapper from "@/components/form-v2/V2Wrapper";
import V2Button from "@/components/form-v2/V2Button";
import { INCOME_OPTIONS } from "@/lib/affiliate-labels";

export default function LeadForm({ refCode }: { refCode: string }) {
  const [form, setForm] = useState({
    name: "",
    nameKana: "",
    postalCode: "",
    address: "",
    phone: "",
    email: "",
    occupation: "",
    income: "",
    website: "", // honeypot（画面には表示しない）
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canSubmit =
    form.name.trim() &&
    form.nameKana.trim() &&
    form.address.trim() &&
    form.phone.length >= 10 &&
    form.email.trim();

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/lp/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ref: refCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "登録に失敗しました。時間をおいて再度お試しください。");
        return;
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  // ──────────────────────────────────────────────
  // 送信完了画面
  // ──────────────────────────────────────────────
  if (done) {
    return (
      <V2Wrapper
        scheme="MRT"
        headerWide
        title={
          <>
            <span className="v2-banner-title-line">お申込みを</span>
            <span className="v2-banner-title-line">受け付けました</span>
          </>
        }
      >
        <div className="v2-form-container" style={{ paddingTop: 40, paddingBottom: 56 }}>
          <section className="v2-section" style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--v2-text-secondary)", lineHeight: 1.9 }}>
              この度は、iPS細胞作製の無料適合確認に
              <br />
              お申込みいただき、誠にありがとうございます。
            </p>
            <p style={{ fontSize: 14, color: "var(--v2-text-secondary)", lineHeight: 1.9, marginTop: 16 }}>
              お申込みの内容を確認のうえ、担当者より
              <br />
              順次お電話にてご連絡させていただきます。
              <br />
              恐れ入りますが、今しばらくお待ちくださいますよう
              <br />
              お願い申し上げます。
            </p>
          </section>
        </div>
      </V2Wrapper>
    );
  }

  // ──────────────────────────────────────────────
  // フォーム本体（iPS適合確認フォーム Step1 と同一項目）
  // ──────────────────────────────────────────────
  return (
    <V2Wrapper
      scheme="MRT"
      headerClassName="v2-header-entry"
      title={
        <>
          <span className="v2-banner-title-line">無料適合確認の</span>
          <br className="v2-banner-title-br-pc" />
          <span className="v2-banner-title-line">お申込み</span>
        </>
      }
      heroImageSrc="/nagashima01.png"
    >
      <div className="v2-form-container" style={{ paddingBottom: 48 }}>
        {error && <div className="v2-error">{error}</div>}

        <section className="v2-section v2-card-connected">
          <p className="v2-section-lead">
            iPS細胞作製の適合確認をご希望の方は、以下のフォームにご入力ください。担当者よりお電話にてご連絡いたします。
          </p>

          <h2 className="v2-section-title">お申込み情報</h2>

          <div className="v2-field">
            <label className="v2-label">
              氏名<span className="v2-required-mark">*</span>
            </label>
            <NameInput
              value={form.name}
              onChange={(v) => update("name", v)}
              onKana={(v) => update("nameKana", v)}
            />
            <div className="v2-help">※ 姓と名の間にスペースを入れてください(例: 山田 太郎)</div>
          </div>

          <div className="v2-field">
            <label className="v2-label">
              フリガナ(カタカナ)<span className="v2-required-mark">*</span>
            </label>
            <input
              value={form.nameKana}
              onChange={(e) => {
                // ひらがな→カタカナ自動変換
                const converted = e.target.value.replace(/[ぁ-ゖ]/g, (ch) =>
                  String.fromCharCode(ch.charCodeAt(0) + 0x60)
                );
                update("nameKana", converted);
              }}
              placeholder="ヤマダ タロウ"
              required
              className="v2-input"
            />
            <div className="v2-help">ひらがなで入力すると自動でカタカナに変換されます</div>
          </div>

          <div className="v2-field">
            <label className="v2-label">郵便番号</label>
            <PostalCodeInput
              value={form.postalCode}
              onChange={(v) => update("postalCode", v)}
              onAddress={(v) => update("address", v)}
            />
          </div>

          <div className="v2-field">
            <label className="v2-label">
              住所<span className="v2-required-mark">*</span>
            </label>
            <input
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="東京都港区..."
              required
              className="v2-input"
            />
          </div>

          <div className="v2-field">
            <label className="v2-label">
              電話番号(ハイフンなし)<span className="v2-required-mark">*</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="09012345678"
              required
              maxLength={11}
              className="v2-input"
              style={{ fontFamily: '"DM Mono", monospace', letterSpacing: "0.05em" }}
            />
          </div>

          <div className="v2-field">
            <label className="v2-label">
              メールアドレス<span className="v2-required-mark">*</span>
            </label>
            <EmailInput value={form.email} onChange={(v) => update("email", v)} />
          </div>

          <div className="v2-field">
            <label className="v2-label">職業</label>
            <select
              value={form.occupation}
              onChange={(e) => update("occupation", e.target.value)}
              className="v2-select"
              style={{ cursor: "pointer" }}
            >
              <option value="">選択してください</option>
              <optgroup label="経営・役員">
                <option value="会社経営者">会社経営者</option>
                <option value="会社役員">会社役員</option>
              </optgroup>
              <optgroup label="会社員・団体職員">
                <option value="会社員(管理職)">会社員(管理職)</option>
                <option value="会社員(一般)">会社員(一般)</option>
                <option value="団体職員">団体職員</option>
                <option value="公務員">公務員</option>
              </optgroup>
              <optgroup label="専門職">
                <option value="医師">医師</option>
                <option value="歯科医師">歯科医師</option>
                <option value="薬剤師">薬剤師</option>
                <option value="看護師">看護師</option>
                <option value="弁護士">弁護士</option>
                <option value="公認会計士・税理士">公認会計士・税理士</option>
                <option value="建築士">建築士</option>
                <option value="その他士業">その他士業</option>
              </optgroup>
              <optgroup label="自営・フリーランス">
                <option value="自営業">自営業</option>
                <option value="フリーランス">フリーランス</option>
                <option value="農林水産業">農林水産業</option>
              </optgroup>
              <optgroup label="その他">
                <option value="不動産オーナー">不動産オーナー</option>
                <option value="投資家">投資家</option>
                <option value="年金生活者">年金生活者</option>
                <option value="主婦・主夫">主婦・主夫</option>
                <option value="学生">学生</option>
                <option value="無職">無職</option>
                <option value="その他">その他</option>
              </optgroup>
            </select>
          </div>

          <div className="v2-field">
            <label className="v2-label">ご年収</label>
            <select
              value={form.income}
              onChange={(e) => update("income", e.target.value)}
              className="v2-select"
              style={{ cursor: "pointer" }}
            >
              <option value="">選択してください</option>
              {INCOME_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* honeypot: botのみが入力する不可視フィールド */}
          <input
            type="text"
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ position: "absolute", left: "-9999px", height: 0, width: 0, opacity: 0 }}
          />

          <div className="v2-subnote" style={{ marginTop: 8 }}>
            <p>※現在または過去の病気歴、服用中のお薬等によっては適合しない場合があります。</p>
            <p>※ご入力いただきました情報はBioVaultが提携するiPS細胞作製ラボに送付され適合確認が行われます。</p>
          </div>

          <div className="v2-btn-row">
            <V2Button variant="primary" onClick={handleSubmit} disabled={!canSubmit || submitting}>
              {submitting ? "送信中..." : "無料適合確認に申し込む"}
            </V2Button>
          </div>
        </section>
      </div>
    </V2Wrapper>
  );
}

// ──────────────────────────────────────────────
// 氏名入力(IMEのcompositionイベントでひらがなをカナへ自動抽出)
// /form/app と同実装
// ──────────────────────────────────────────────
function NameInput({
  value,
  onChange,
  onKana,
}: {
  value: string;
  onChange: (v: string) => void;
  onKana: (v: string) => void;
}) {
  const confirmedKana = useRef("");
  const isComposing = useRef(false);
  const lastCompositionData = useRef("");

  const handleCompositionStart = () => {
    isComposing.current = true;
    lastCompositionData.current = "";
  };

  const handleCompositionUpdate = (e: React.CompositionEvent<HTMLInputElement>) => {
    if (e.data) {
      const hasHiragana = /[ぁ-ゖ]/.test(e.data);
      if (hasHiragana) {
        lastCompositionData.current = toKatakana(e.data);
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
      if (e.key === " " || e.key === "　") {
        confirmedKana.current += " ";
        onKana(confirmedKana.current);
      }
      if (e.key === "Backspace") {
        confirmedKana.current = confirmedKana.current.slice(0, -1);
        onKana(confirmedKana.current);
      }
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
      className="v2-input"
    />
  );
}

function toKatakana(str: string): string {
  return str.replace(/[ぁ-ゖ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
}

// ──────────────────────────────────────────────
// 郵便番号入力(7桁で zipcloud から住所自動取得)
// /form/app と同実装
// ──────────────────────────────────────────────
function PostalCodeInput({
  value,
  onChange,
  onAddress,
}: {
  value: string;
  onChange: (v: string) => void;
  onAddress: (v: string) => void;
}) {
  const [searching, setSearching] = useState(false);

  const handleChange = async (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "").slice(0, 7);
    let formatted = digits;
    if (digits.length > 3) {
      formatted = digits.slice(0, 3) + "-" + digits.slice(3);
    }
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
      } catch {
        // 検索失敗は無視（手入力できるため）
      } finally {
        setSearching(false);
      }
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="000-0000"
        maxLength={8}
        className="v2-input"
        style={{ fontFamily: '"DM Mono", monospace' }}
      />
      {searching && (
        <span
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 12,
            color: "var(--v2-text-muted)",
          }}
        >
          検索中...
        </span>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// メールアドレス入力(500ms debounce で /api/apply/check-email)
// /form/app と同実装
// ──────────────────────────────────────────────
function EmailInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [emailError, setEmailError] = useState("");
  const [checking, setChecking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkEmail = async (email: string) => {
    if (!email || !email.includes("@")) {
      setEmailError("");
      return;
    }
    setChecking(true);
    try {
      const res = await fetch("/api/apply/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.available) {
        setEmailError(data.error || "このメールアドレスは使用できません");
      } else {
        setEmailError("");
      }
    } catch {
      // チェック失敗は無視
    } finally {
      setChecking(false);
    }
  };

  const handleChange = (email: string) => {
    onChange(email);
    setEmailError("");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => checkEmail(email), 500);
  };

  return (
    <div>
      <div style={{ position: "relative" }}>
        <input
          type="email"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="your@email.com"
          required
          className="v2-input"
          style={emailError ? { borderColor: "var(--v2-required)" } : undefined}
        />
        {checking && (
          <span
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 12,
              color: "var(--v2-text-muted)",
            }}
          >
            確認中...
          </span>
        )}
      </div>
      {emailError && (
        <div style={{ fontSize: 12, color: "var(--v2-required)", marginTop: 4 }}>{emailError}</div>
      )}
    </div>
  );
}
