/**
 * /form-v2-preview/contact
 *
 * v2 デザイン版のお問い合わせフォームページ。
 *
 * - 項目: 氏名 / メールアドレス / お問い合わせ内容(すべて必須)
 * - 送信API: /api/contact-v2 (DB保存なし、管理者通知+顧客自動返信の2通SES送信)
 * - スキーム判定: パスから自動判定 (/m/ 配下 → MRT, それ以外 → SCPP)
 * - 送信成功時は /form-v2-preview/contact/thanks に遷移
 *
 * ヒーローは画像なしのタイトル+説明文のみ。
 */

"use client";

import { Suspense, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import V2Wrapper from "@/components/form-v2/V2Wrapper";
import V2Button from "@/components/form-v2/V2Button";
import { detectSchemeFromPath } from "@/lib/scheme";

export default function ContactPageWrapper() {
  return (
    <Suspense fallback={<V2Wrapper><div style={{ minHeight: "60vh" }} /></V2Wrapper>}>
      <ContactPage />
    </Suspense>
  );
}

function ContactPage() {
  const pathname = usePathname();
  const router = useRouter();
  const scheme = detectSchemeFromPath(pathname);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = name.trim() && email.trim() && message.trim() && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/contact-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, scheme }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "送信に失敗しました");
        setSubmitting(false);
        return;
      }
      router.push("/form-v2-preview/contact/thanks");
    } catch {
      setError("エラーが発生しました。時間をおいて再度お試しください。");
      setSubmitting(false);
    }
  };

  return (
    <V2Wrapper scheme={scheme}>
      {/* ヒーロー(画像なし、タイトル+説明文のみ) */}
      <section className="v2-hero">
        <div className="v2-hero-grid">
          <div>
            <h1 className="v2-hero-title">お問い合わせ</h1>
            <p className="v2-hero-desc">
              BioVaultメンバーシップサイトに関するご質問・ご相談等は、下記フォームよりお気軽にお問い合わせください。担当者より順次ご連絡させていただきます。
            </p>
          </div>
        </div>
      </section>

      <div className="v2-form-container" style={{ paddingBottom: 48 }}>
        {error && <div className="v2-error">{error}</div>}

        <section className="v2-section">
          <h2 className="v2-section-title">お問い合わせフォーム</h2>

          <div className="v2-field">
            <label className="v2-label">
              お名前<span className="v2-required-mark">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 太郎"
              maxLength={100}
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              maxLength={254}
              required
              className="v2-input"
            />
          </div>

          <div className="v2-field">
            <label className="v2-label">
              お問い合わせ内容<span className="v2-required-mark">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="お問い合わせ内容をご入力ください"
              maxLength={5000}
              required
              rows={8}
              className="v2-input v2-textarea"
            />
            <div className="v2-help">{message.length} / 5000 文字</div>
          </div>

          <div className="v2-btn-row">
            <V2Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
              {submitting ? "送信中..." : "送信する"}
            </V2Button>
          </div>
        </section>
      </div>
    </V2Wrapper>
  );
}
