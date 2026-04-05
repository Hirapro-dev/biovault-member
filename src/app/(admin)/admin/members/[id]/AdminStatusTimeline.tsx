"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_TIMELINE = [
  { key: "TERMS_AGREED", label: "iPS細胞作製適合確認", icon: "📋", dbStatus: "TERMS_AGREED" },
  { key: "DOC_PRIVACY", label: "重要事項確認／個人情報取扱同意確認", icon: "📜", dbStatus: null },
  { key: "REGISTERED", label: "メンバーシップ登録", icon: "👤", dbStatus: "REGISTERED" },
  { key: "SERVICE_APPLIED", label: "サービス申込", icon: "✍️", dbStatus: "SERVICE_APPLIED" },
  { key: "PAYMENT_CONFIRMED", label: "入金確認", icon: "💰", dbStatus: null },
  { key: "SCHEDULE_ARRANGED", label: "日程調整", icon: "📅", dbStatus: "SCHEDULE_ARRANGED" },
  { key: "DOC_CELL_CONSENT", label: "細胞提供・保管同意", icon: "🧫", dbStatus: null },
  { key: "DOC_INFORMED", label: "インフォームドコンセント", icon: "📄", dbStatus: null },
  { key: "BLOOD_COLLECTED", label: "問診・採血", icon: "💉", dbStatus: "BLOOD_COLLECTED" },
  { key: "IPS_CREATING", label: "iPS細胞作製中", icon: "🧬", dbStatus: "IPS_CREATING" },
  { key: "STORAGE_ACTIVE", label: "iPS細胞保管", icon: "🏛️", dbStatus: "STORAGE_ACTIVE" },
] as const;

interface Props {
  userId: string;
  currentStatus: string;
  paymentStatus: string;
  signedDocTypes: string[];
  hasAgreedTerms: boolean;
}

export default function AdminStatusTimeline({ userId, currentStatus, paymentStatus, signedDocTypes, hasAgreedTerms }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const DB_ORDER = ["REGISTERED", "TERMS_AGREED", "SERVICE_APPLIED", "SCHEDULE_ARRANGED", "BLOOD_COLLECTED", "IPS_CREATING", "STORAGE_ACTIVE"];
  const currentIdx = DB_ORDER.indexOf(currentStatus);

  const isDone = (key: string) => {
    if (key === "DOC_PRIVACY") return signedDocTypes.includes("PRIVACY_POLICY") || hasAgreedTerms;
    if (key === "DOC_CELL_CONSENT") return signedDocTypes.includes("CELL_STORAGE_CONSENT");
    if (key === "DOC_INFORMED") return signedDocTypes.includes("INFORMED_CONSENT");
    if (key === "PAYMENT_CONFIRMED") return paymentStatus === "COMPLETED";
    const idx = DB_ORDER.indexOf(key);
    return idx !== -1 && currentIdx >= idx;
  };

  // チェックボックスクリック時のハンドラ
  const handleToggle = async (step: typeof ADMIN_TIMELINE[number], done: boolean) => {
    if (loading) return;

    // DB上のステータス変更が必要な場合
    if (step.dbStatus) {
      if (done) return; // 完了済みのDB ステータスはチェックボックスでは戻さない（ステータス変更フォームを使用）

      setLoading(step.key);
      try {
        await fetch(`/api/admin/members/${userId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newStatus: step.dbStatus, note: `管理者がステータスを「${step.label}」に変更` }),
        });
        router.refresh();
      } finally {
        setLoading(null);
      }
      return;
    }

    // 入金確認の場合
    if (step.key === "PAYMENT_CONFIRMED" && !done) {
      setLoading(step.key);
      try {
        await fetch(`/api/admin/members/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentStatus: "COMPLETED", paidAmount: 8800000 }),
        });
        router.refresh();
      } finally {
        setLoading(null);
      }
      return;
    }

    // 書類同意の場合はチェックのみ（実際の同意は会員本人が行う）
  };

  return (
    <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
      <div className="space-y-1">
        {ADMIN_TIMELINE.map((step) => {
          const done = isDone(step.key);
          const isLoading = loading === step.key;
          // 書類同意ステップかどうか
          const isDocStep = ["DOC_PRIVACY", "DOC_CELL_CONSENT", "DOC_INFORMED"].includes(step.key);
          // クリック可能かどうか（DB ステータスの場合は未完了のみ、書類は会員本人のみ、入金は未完了のみ）
          const canToggle = !done && !isDocStep && !isLoading;

          return (
            <div
              key={step.key}
              onClick={() => canToggle && handleToggle(step, done)}
              className={`flex items-center gap-3 py-3 px-3 rounded transition-colors ${canToggle ? "cursor-pointer hover:bg-bg-elevated" : ""}`}
            >
              {/* カスタムチェックボックス */}
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                done
                  ? "bg-gold border-gold"
                  : canToggle
                  ? "border-text-muted/40 hover:border-gold/60"
                  : "border-border"
              }`}>
                {done && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7L6 10L11 4" stroke="#070709" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              {/* アイコン */}
              <span className={`text-base shrink-0 ${done ? "opacity-100" : "opacity-30"}`}>{step.icon}</span>
              {/* ラベル */}
              <span className={`text-sm ${done ? "text-gold font-medium" : "text-text-muted"}`}>
                {step.label}
              </span>
              {/* ローディング */}
              {isLoading && <span className="text-[10px] text-gold ml-auto animate-pulse">更新中...</span>}
              {/* 書類ステップの注記 */}
              {isDocStep && !done && (
                <span className="text-[10px] text-text-muted ml-auto">会員本人が同意</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
