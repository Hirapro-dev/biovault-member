"use client";

/**
 * リード登録フォーム（LP経由の見込み顧客）
 * iPS適合確認フォーム(/form/app・/form/ips-check)と同じ v2 デザインで統一。
 */

import { useState } from "react";
import V2Wrapper from "@/components/form-v2/V2Wrapper";
import V2Button from "@/components/form-v2/V2Button";
import { INCOME_OPTIONS } from "@/lib/affiliate-labels";

export default function LeadForm({ refCode }: { refCode: string }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    occupation: "",
    position: "",
    income: "",
    website: "", // honeypot（画面には表示しない）
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canSubmit =
    form.name.trim() && form.email.trim() && form.address.trim() && form.phone.length >= 10;

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
              ご登録ありがとうございます。
              <br />
              担当者より順次お電話にてご連絡いたしますので、
              <br />
              今しばらくお待ちください。
            </p>
          </section>
        </div>
      </V2Wrapper>
    );
  }

  // ──────────────────────────────────────────────
  // フォーム本体
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
              お名前<span className="v2-required-mark">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="山田 太郎"
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
          </div>

          <div className="v2-field">
            <label className="v2-label">
              ご住所<span className="v2-required-mark">*</span>
            </label>
            <input
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="東京都〇〇区〇〇 1-2-3"
              required
              className="v2-input"
            />
          </div>

          <div className="v2-field">
            <label className="v2-label">
              お電話番号(ハイフンなし)<span className="v2-required-mark">*</span>
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
            <label className="v2-label">ご職業</label>
            <input
              value={form.occupation}
              onChange={(e) => update("occupation", e.target.value)}
              placeholder="会社経営"
              className="v2-input"
            />
          </div>

          <div className="v2-field">
            <label className="v2-label">役職</label>
            <input
              value={form.position}
              onChange={(e) => update("position", e.target.value)}
              placeholder="代表取締役"
              className="v2-input"
            />
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
