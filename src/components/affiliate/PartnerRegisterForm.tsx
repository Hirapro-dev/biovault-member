"use client";

/**
 * 紹介協力者のセルフ登録フォーム（チャネル別ページから利用）
 * iPS適合確認フォーム(/form/app・/form/ips-check)と同じ v2 デザインで統一。
 */

import { useState } from "react";
import V2Wrapper from "@/components/form-v2/V2Wrapper";
import V2Button from "@/components/form-v2/V2Button";

export default function PartnerRegisterForm({ channel }: { channel: "NW" | "KAWARA" }) {
  const [form, setForm] = useState({
    name: "",
    nameKana: "",
    email: "",
    phone: "",
    displayName: "",
    website: "", // honeypot（画面には表示しない）
  });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"" | "pending" | "active">("");
  const [error, setError] = useState("");

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canSubmit =
    form.name.trim() &&
    form.nameKana.trim() &&
    form.email.trim() &&
    form.phone.length >= 10 &&
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
    <V2Wrapper scheme="MRT" title={pageTitle}>
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
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="山田 太郎"
              required
              className="v2-input"
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
            <div className="v2-help">ひらがなで入力すると自動でカタカナに変換されます</div>
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
