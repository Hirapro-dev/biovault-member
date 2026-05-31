/**
 * /form-v2-preview/contact/thanks
 *
 * お問い合わせ送信完了画面。
 * /form-v2-preview/contact から送信成功時に遷移してくる。
 *
 * - 画像なしのシンプルなセンタリングレイアウト
 * - スキーム判定(SCPP/MRT)はパスから自動判定
 * - フォームに戻るリンクとトップに戻るリンクを提供
 */

"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import V2Wrapper from "@/components/form-v2/V2Wrapper";
import { detectSchemeFromPath } from "@/lib/scheme";

export default function ContactThanksWrapper() {
  return (
    <Suspense fallback={<V2Wrapper><div style={{ minHeight: "60vh" }} /></V2Wrapper>}>
      <ContactThanksPage />
    </Suspense>
  );
}

function ContactThanksPage() {
  const pathname = usePathname();
  const scheme = detectSchemeFromPath(pathname);

  return (
    <V2Wrapper scheme={scheme}>
      <div className="v2-form-container" style={{ paddingTop: 56, paddingBottom: 56 }}>
        <section className="v2-section" style={{ marginTop: 0, textAlign: "center" }}>
          <div
            style={{
              fontSize: 56,
              lineHeight: 1,
              marginBottom: 16,
              color: "var(--v2-success)",
            }}
          >
            ✓
          </div>
          <h2
            style={{
              fontFamily: '"Noto Serif JP", serif',
              fontSize: 24,
              fontWeight: 700,
              color: "var(--v2-gold)",
              marginBottom: 20,
              letterSpacing: "0.04em",
              lineHeight: 1.5,
            }}
          >
            お問い合わせを承りました
          </h2>
          <div
            style={{
              fontSize: 15,
              color: "var(--v2-text-secondary)",
              lineHeight: 1.95,
              maxWidth: 520,
              margin: "0 auto",
            }}
          >
            <p style={{ marginBottom: 16 }}>
              お問い合わせいただき、誠にありがとうございます。
              <br />
              ご入力いただいたメールアドレス宛に、受領確認のメールをお送りしました。
            </p>
            <p style={{ marginBottom: 16 }}>
              内容を確認の上、担当者より改めてご連絡させていただきます。
            </p>
            <p style={{ fontSize: 13, color: "var(--v2-text-muted)" }}>
              ※ ご返信までしばらくお時間をいただく場合がございます。
              <br />
              ※ 自動返信メールが届かない場合は、迷惑メールフォルダ等もご確認ください。
            </p>
          </div>

          <div style={{ marginTop: 32 }}>
            <Link
              href="/form-v2-preview"
              style={{
                fontSize: 14,
                color: "var(--v2-gold-dark)",
                textDecoration: "underline",
                letterSpacing: "0.04em",
              }}
            >
              申請フォームへ戻る
            </Link>
          </div>
        </section>
      </div>
    </V2Wrapper>
  );
}
