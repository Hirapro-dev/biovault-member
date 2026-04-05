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
  const [loading, setLoading] = useState(false);
  // チェック状態を管理（変更前の状態を保持）
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());

  const DB_ORDER = ["REGISTERED", "TERMS_AGREED", "SERVICE_APPLIED", "SCHEDULE_ARRANGED", "BLOOD_COLLECTED", "IPS_CREATING", "STORAGE_ACTIVE"];
  const currentIdx = DB_ORDER.indexOf(currentStatus);

  const isOriginallyDone = (key: string) => {
    if (key === "DOC_PRIVACY") return signedDocTypes.includes("PRIVACY_POLICY") || hasAgreedTerms;
    if (key === "DOC_CELL_CONSENT") return signedDocTypes.includes("CELL_STORAGE_CONSENT");
    if (key === "DOC_INFORMED") return signedDocTypes.includes("INFORMED_CONSENT");
    if (key === "PAYMENT_CONFIRMED") return paymentStatus === "COMPLETED";
    const idx = DB_ORDER.indexOf(key);
    return idx !== -1 && currentIdx >= idx;
  };

  // 表示上のチェック状態（元の状態 + ペンディング変更）
  const isChecked = (key: string) => {
    if (pendingChanges.has(key)) return !isOriginallyDone(key);
    return isOriginallyDone(key);
  };

  // チェックボックスをトグル
  const handleToggle = (key: string) => {
    setPendingChanges((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // 更新ボタン
  const handleUpdate = async () => {
    if (pendingChanges.size === 0 || loading) return;
    setLoading(true);

    try {
      for (const key of pendingChanges) {
        const step = ADMIN_TIMELINE.find((s) => s.key === key);
        if (!step) continue;

        const willBeChecked = !isOriginallyDone(key);

        // DBステータス変更
        if (step.dbStatus && willBeChecked) {
          await fetch(`/api/admin/members/${userId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newStatus: step.dbStatus, note: `管理者がステータスを「${step.label}」に変更` }),
          });
        }

        // 入金確認
        if (key === "PAYMENT_CONFIRMED" && willBeChecked) {
          await fetch(`/api/admin/members/${userId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentStatus: "COMPLETED", paidAmount: 8800000 }),
          });
        }
      }

      setPendingChanges(new Set());
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const hasPending = pendingChanges.size > 0;

  return (
    <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
      <div className="space-y-1">
        {ADMIN_TIMELINE.map((step) => {
          const done = isChecked(step.key);
          const originalDone = isOriginallyDone(step.key);
          // 管理者が操作可能: 入金確認・日程調整・問診採血・作製中・保管
          const adminToggleKeys = ["PAYMENT_CONFIRMED", "SCHEDULE_ARRANGED", "BLOOD_COLLECTED", "IPS_CREATING", "STORAGE_ACTIVE"];
          const canToggle = adminToggleKeys.includes(step.key) && !loading;
          const isMemberOnly = !adminToggleKeys.includes(step.key);
          const isPending = pendingChanges.has(step.key);

          return (
            <div
              key={step.key}
              onClick={() => canToggle && handleToggle(step.key)}
              className={`flex items-center gap-3 py-3 px-3 rounded transition-colors ${canToggle ? "cursor-pointer hover:bg-bg-elevated" : ""} ${isPending ? "bg-gold/5" : ""}`}
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
              {/* 変更予定マーク */}
              {isPending && (
                <span className="text-[10px] text-gold ml-auto">{done && !originalDone ? "← 変更予定" : originalDone && !done ? "← 解除予定" : ""}</span>
              )}
              {/* 会員本人操作の注記 */}
              {isMemberOnly && !done && !isPending && (
                <span className="text-[10px] text-text-muted ml-auto">会員本人が同意</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 更新ボタン */}
      {hasPending && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPendingChanges(new Set())}
              className="px-4 py-2 bg-transparent border border-border text-text-secondary rounded-sm text-xs cursor-pointer hover:border-border-gold transition-all"
            >
              キャンセル
            </button>
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="flex-1 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? "更新中..." : "ステータスを更新"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
