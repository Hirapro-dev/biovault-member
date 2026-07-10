"use client";

/**
 * 紹介協力者のセルフ登録フォーム（チャネル別ページから利用）
 * iPS適合確認フォーム(/form/app・/form/ips-check)と同じ v2 デザインで統一。
 *
 * - ヘッダー背景は introduction-bg.mp4
 * - 氏名入力時にIMEのcompositionイベントからフリガナを自動抽出（既存申請フォームと同仕様）
 * - 郵便番号7桁入力で住所を自動反映（zipcloud）
 * - 生年月日を選択すると満年齢を自動表示
 */

import { useRef, useState } from "react";
import V2Wrapper from "@/components/form-v2/V2Wrapper";
import V2Button from "@/components/form-v2/V2Button";

export default function PartnerRegisterForm({ channel }: { channel: "NW" | "KAWARA" }) {
  const [form, setForm] = useState({
    name: "",
    nameKana: "",
    email: "",
    phone: "",
    postalCode: "",
    address: "",
    dateOfBirth: "",
    displayName: "",
    website: "", // honeypot（画面には表示しない）
  });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"" | "pending" | "active">("");
  const [error, setError] = useState("");

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const age = calcAge(form.dateOfBirth);

  const canSubmit =
    form.name.trim() &&
    form.nameKana.trim() &&
    form.email.trim() &&
    form.phone.length >= 10 &&
    form.address.trim() &&
    form.dateOfBirth &&
    agreed;

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/partner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, channel, hasAgreedTerms: agreed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "登録に失敗しました。時間をおいて再度お試しください。");
        return;
      }
      setResult(data.pending ? "pending" : "active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  const pageTitle = (
    <>
      <span className="v2-banner-title-line">紹介協力制度</span>
      <br className="v2-banner-title-br-pc" />
      <span className="v2-banner-title-line">ご登録フォーム</span>
    </>
  );

  // ──────────────────────────────────────────────
  // 送信完了画面
  // ──────────────────────────────────────────────
  if (result) {
    return (
      <V2Wrapper
        scheme="MRT"
        headerWide
        headerVideoSrc="/introduction-bg.mp4"
        title={
          <>
            <span className="v2-banner-title-line">ご登録を</span>
            <span className="v2-banner-title-line">受け付けました</span>
          </>
        }
      >
        <div className="v2-form-container" style={{ paddingTop: 40, paddingBottom: 56 }}>
          <section className="v2-section" style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "var(--v2-text-secondary)", lineHeight: 1.9 }}>
              {result === "pending" ? (
                <>
                  ご登録ありがとうございます。
                  <br />
                  事務局にて登録内容を確認のうえ、
                  <br />
                  ログイン情報とご紹介用URLをメールでお送りします。
                  <br />
                  今しばらくお待ちください。
                </>
              ) : (
                <>
                  ご登録ありがとうございます。
                  <br />
                  ログイン情報とご紹介用URLをメールでお送りしました。
                  <br />
                  メールをご確認のうえ、専用ページにログインしてください。
                </>
              )}
            </p>
          </section>
        </div>
      </V2Wrapper>
    );
  }

  // ──────────────────────────────────────────────
  // 登録フォーム本体
  // ──────────────────────────────────────────────
  return (
    <V2Wrapper scheme="MRT" title={pageTitle} headerVideoSrc="/introduction-bg.mp4">
      <div className="v2-form-container" style={{ paddingBottom: 48 }}>
        {error && <div className="v2-error">{error}</div>}

        <section className="v2-section v2-card-connected">
          <p className="v2-section-lead">
            ご登録いただくと、あなた専用のご紹介用URLが発行されます。専用URL経由のお申込み実績に応じて報酬をお支払いします。
          </p>

          <h2 className="v2-section-title">ご登録者情報</h2>

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
                // ひらがな→カタカナ自動変換（既存申請フォームと同仕様）
                const converted = e.target.value.replace(/[ぁ-ゖ]/g, (ch) =>
                  String.fromCharCode(ch.charCodeAt(0) + 0x60)
                );
                update("nameKana", converted);
              }}
              placeholder="ヤマダ タロウ"
              required
              className="v2-input"
            />
            <div className="v2-help">氏名を入力すると自動で反映されます（修正も可能です）</div>
          </div>

          <div className="v2-field">
            <label className="v2-label">
              生年月日<span className="v2-required-mark">*</span>
            </label>
            <DateSelect
              value={form.dateOfBirth}
              onChange={(v) => update("dateOfBirth", v)}
              yearStart={1930}
              yearEnd={2010}
            />
            {age !== null && (
              <div className="v2-help" style={{ color: "var(--v2-gold-dark)", fontWeight: 700 }}>
                満 {age} 歳
              </div>
            )}
          </div>

          <div className="v2-field">
            <label className="v2-label">郵便番号</label>
            <PostalCodeInput
              value={form.postalCode}
              onChange={(v) => update("postalCode", v)}
              onAddress={(v) => update("address", v)}
            />
            <div className="v2-help">7桁入力すると住所が自動で反映されます</div>
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
              メールアドレス<span className="v2-required-mark">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="example@mail.com"
              required
              className="v2-input"
            />
            <div className="v2-help">ログイン情報とご紹介用URLをお送りします</div>
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
            <label className="v2-label">活動名(任意)</label>
            <input
              value={form.displayName}
              onChange={(e) => update("displayName", e.target.value)}
              placeholder="SNSアカウント名・サイト名など"
              className="v2-input"
            />
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

          <div className="v2-notice">
            紹介協力制度の規約および個人情報の取扱いに同意のうえ、ご登録ください。ご入力いただいた情報は、ご紹介実績の管理および報酬のお支払いのために利用します。
          </div>

          <label className="v2-checkbox-row">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className="v2-checkbox-label">上記の内容を理解し、同意します</span>
          </label>

          <div className="v2-btn-row">
            <V2Button variant="primary" onClick={handleSubmit} disabled={!canSubmit || submitting}>
              {submitting ? "送信中..." : "登録する"}
            </V2Button>
          </div>
        </section>
      </div>
    </V2Wrapper>
  );
}

// ──────────────────────────────────────────────
// 満年齢の計算（生年月日が揃うまでは null）
// ──────────────────────────────────────────────
function calcAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());
  if (beforeBirthday) age--;
  return age >= 0 && age <= 130 ? age : null;
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
// 年/月/日 プルダウン日付選択
// /form/app の実装をベースに、空の初期値からでも部分選択を保持できるよう
// 年月日をローカルstateで持つ（3つ揃った時のみ親へ確定値を渡す）
// ──────────────────────────────────────────────
function DateSelect({
  value,
  onChange,
  yearStart = 1930,
  yearEnd = 2030,
}: {
  value: string;
  onChange: (v: string) => void;
  yearStart?: number;
  yearEnd?: number;
}) {
  const initial = value ? value.split("-") : ["", "", ""];
  const [year, setYear] = useState(initial[0] || "");
  const [month, setMonth] = useState(initial[1] || "");
  const [day, setDay] = useState(initial[2] || "");

  const updateDate = (y: string, m: string, d: string) => {
    setYear(y);
    setMonth(m);
    setDay(d);
    if (y && m && d) {
      onChange(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
    } else {
      onChange("");
    }
  };

  const years: number[] = [];
  for (let y = yearStart; y <= yearEnd; y++) years.push(y);

  const daysInMonth = year && month ? new Date(Number(year), Number(month), 0).getDate() : 31;

  return (
    <div className="v2-date-row">
      <select
        value={year}
        onChange={(e) => updateDate(e.target.value, month, day)}
        className="v2-select"
      >
        <option value="">年</option>
        {years.map((y) => (
          <option key={y} value={String(y)}>{y}年</option>
        ))}
      </select>
      <select
        value={month ? String(Number(month)) : ""}
        onChange={(e) => updateDate(year, e.target.value, day)}
        className="v2-select"
      >
        <option value="">月</option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <option key={m} value={String(m)}>{m}月</option>
        ))}
      </select>
      <select
        value={day ? String(Number(day)) : ""}
        onChange={(e) => updateDate(year, month, e.target.value)}
        className="v2-select"
      >
        <option value="">日</option>
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
          <option key={d} value={String(d)}>{d}日</option>
        ))}
      </select>
    </div>
  );
}
