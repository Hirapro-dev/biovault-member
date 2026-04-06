"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// ── 免責事項の定義（バージョン管理） ──
const PAMPHLET_CONFIG = {
  documentId: "pamphlet-v1",
  documentTitle: "BioVaultパンフレット",
  documentVersion: "1.0",
  documentUrl: "https://drive.google.com/file/d/1gGko6WSnt8jSR8k6GbsLby5kp3hQbXtE/view?usp=sharing",
  consentTextVersion: "1.0",
  consentText: `本資料は、BioVaultのサービス内容、流れ、費用、提携体制などをご理解いただくための会員向け説明資料です。記載内容は、iPS細胞技術や関連成分、サービス設計に関する一般的な情報を中心としたものであり、個別の効果や施術結果をお約束するものではありません。施術の実施可否や適応判断、医学的なご説明および同意確認は、別途、提携医療機関の医師によって個別に行われます。
内容をご確認のうえ、ご了承いただける場合のみ、次へお進みください。`,
  checkboxText: "私は、本資料がサービス理解のための説明資料であり、特定の効果・施術結果を保証するものではないことを理解しました。",
  buttonText: "内容を確認して閲覧する",
};

export default function PamphletPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [alreadyAgreed, setAlreadyAgreed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const popupDisplayedAt = useRef<string>(new Date().toISOString());

  // 同意済みか確認
  useEffect(() => {
    const checkConsent = async () => {
      try {
        const res = await fetch("/api/member/consent");
        if (res.ok) {
          const logs = await res.json();
          const hasPamphletConsent = logs.some(
            (log: { documentId: string; consentAction: string }) =>
              log.documentId === PAMPHLET_CONFIG.documentId && log.consentAction === "agreed"
          );
          if (hasPamphletConsent) {
            setAlreadyAgreed(true);
          }
        }
      } catch {
        // エラーでも同意画面を表示
      } finally {
        setLoading(false);
      }
    };
    checkConsent();
  }, []);

  // 同意してパンフレットを開く
  const handleConsent = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/member/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...PAMPHLET_CONFIG,
          consentTextSnapshot: PAMPHLET_CONFIG.consentText,
          popupDisplayedAt: popupDisplayedAt.current,
          viewStartedAt: new Date().toISOString(),
        }),
      });

      // 同意完了 → パンフレットを開いてページを同意済み状態にリフレッシュ
      window.open(PAMPHLET_CONFIG.documentUrl, "_blank");
      setAlreadyAgreed(true);
    } catch {
      window.open(PAMPHLET_CONFIG.documentUrl, "_blank");
      setAlreadyAgreed(true);
    } finally {
      setSubmitting(false);
    }
  };

  // ローディング
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-text-muted text-sm">読み込み中...</div>
      </div>
    );
  }

  // 同意済みの場合 → そのままパンフレットを開く
  if (alreadyAgreed) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="text-3xl mb-4">📖</div>
        <h2 className="font-serif-jp text-lg text-text-primary tracking-wider mb-3">
          BioVaultパンフレット
        </h2>
        <p className="text-sm text-text-muted mb-6">
          免責事項への同意は確認済みです
        </p>
        <a
          href={PAMPHLET_CONFIG.documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-8 py-3 bg-gold-gradient text-bg-primary text-sm font-medium rounded tracking-wider hover:opacity-90 transition-opacity"
        >
          パンフレットを閲覧する
        </a>
      </div>
    );
  }

  // 未同意 → 免責事項同意画面
  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="text-3xl mb-3">📖</div>
        <h2 className="font-serif-jp text-lg text-text-primary tracking-wider">
          BioVaultパンフレット
        </h2>
        <p className="text-xs text-text-muted mt-2">閲覧前に以下の免責事項をご確認ください</p>
      </div>

      {/* 免責事項 */}
      <div className="bg-bg-secondary border border-border rounded-md p-6 mb-5">
        <h3 className="text-xs text-gold tracking-wider mb-4 pb-2 border-b border-border">
          免責事項
        </h3>
        <p className="text-sm text-text-primary leading-[2]">
          {PAMPHLET_CONFIG.consentText}
        </p>
      </div>

      {/* チェックボックス */}
      <div className="bg-bg-secondary border border-border rounded-md p-5 mb-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="w-5 h-5 mt-0.5 accent-[var(--color-gold-primary)] cursor-pointer shrink-0"
          />
          <span className="text-sm text-text-secondary leading-relaxed">
            {PAMPHLET_CONFIG.checkboxText}
          </span>
        </label>
      </div>

      {/* 同意ボタン */}
      <button
        onClick={handleConsent}
        disabled={!checked || submitting}
        className={`w-full py-4 rounded text-sm tracking-wider font-medium transition-all cursor-pointer ${
          checked
            ? "bg-gold-gradient text-bg-primary hover:opacity-90"
            : "bg-bg-elevated text-text-muted opacity-40 cursor-not-allowed"
        }`}
      >
        {submitting ? "処理中..." : PAMPHLET_CONFIG.buttonText}
      </button>

      <p className="text-[10px] text-text-muted text-center mt-4">
        ※ 同意は初回のみ必要です。次回以降は直接閲覧できます。
      </p>
    </div>
  );
}
