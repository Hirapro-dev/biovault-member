"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

// 培養上清液の注文ステータスステップ
const CF_STEPS = [
  { key: "APPLIED", label: "追加購入申込み", adminToggle: false },
  { key: "PAYMENT_CONFIRMED", label: "入金確認", adminToggle: true },
  { key: "PRODUCING", label: "精製・管理保管", adminToggle: true },
  { key: "CLINIC_BOOKING", label: "クリニック予約手配", adminToggle: true },
  { key: "INFORMED_AGREED", label: "事前説明・同意", adminToggle: false },
  { key: "RESERVATION_CONFIRMED", label: "予約確定", adminToggle: true },
  { key: "COMPLETED", label: "施術完了", adminToggle: true },
] as const;

// ステータスの進行順序
const STATUS_ORDER: string[] = CF_STEPS.map((s) => s.key);

// ステータスバッジの色マッピング
const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  APPLIED: { label: "申込済", color: "bg-blue-500/20 text-blue-400" },
  PAYMENT_CONFIRMED: { label: "入金済", color: "bg-emerald-500/20 text-emerald-400" },
  PRODUCING: { label: "精製中", color: "bg-amber-500/20 text-amber-400" },
  CLINIC_BOOKING: { label: "予約手配中", color: "bg-purple-500/20 text-purple-400" },
  INFORMED_AGREED: { label: "同意済", color: "bg-cyan-500/20 text-cyan-400" },
  RESERVATION_CONFIRMED: { label: "予約確定", color: "bg-indigo-500/20 text-indigo-400" },
  COMPLETED: { label: "施術完了", color: "bg-status-active/20 text-status-active" },
};

interface Props {
  userId: string;
  orders: {
    id: string;
    planType: string;
    planLabel: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    producedAt: string | null;
    expiresAt: string | null;
    clinicDate: string | null;
    clinicName: string | null;
    cautionAgreedAt: string | null;
    informedAgreedAt: string | null;
    createdAt: string;
  }[];
}

export default function CultureFluidStatusManager({ userId, orders }: Props) {
  const router = useRouter();
  const [loadingOrder, setLoadingOrder] = useState<string | null>(null);

  // 精製日付入力ポップアップ
  const [showProducedPopup, setShowProducedPopup] = useState<string | null>(null);
  const [inputProducedDate, setInputProducedDate] = useState("");
  const [producedLoading, setProducedLoading] = useState(false);

  // クリニック予約ポップアップ
  const [showClinicPopup, setShowClinicPopup] = useState<string | null>(null);
  const [inputClinicDate, setInputClinicDate] = useState("");
  const [inputClinicName, setInputClinicName] = useState("");
  const [inputClinicAddress, setInputClinicAddress] = useState("");
  const [inputClinicPhone, setInputClinicPhone] = useState("");
  const [clinicLoading, setClinicLoading] = useState(false);

  // 注文が無い場合
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-bg-secondary border border-border rounded-md p-6">
        <p className="text-sm text-text-muted text-center">培養上清液の注文はありません</p>
      </div>
    );
  }

  // 注文のステータスからステップの完了状態を判定
  const isStepDone = (order: Props["orders"][number], stepKey: string): boolean => {
    const orderStatusIdx = STATUS_ORDER.indexOf(order.status);
    const stepIdx = STATUS_ORDER.indexOf(stepKey);

    switch (stepKey) {
      case "APPLIED":
        // 申込は常に完了
        return true;
      case "PAYMENT_CONFIRMED":
        return order.paymentStatus === "COMPLETED";
      case "PRODUCING":
        return !!order.producedAt;
      case "CLINIC_BOOKING":
        return !!order.clinicDate && !!order.clinicName;
      case "INFORMED_AGREED":
        return !!order.informedAgreedAt;
      case "RESERVATION_CONFIRMED":
        return orderStatusIdx >= stepIdx;
      case "COMPLETED":
        return order.status === "COMPLETED";
      default:
        return false;
    }
  };

  // PATCH APIを呼び出す共通関数
  const patchOrder = async (orderId: string, body: Record<string, unknown>) => {
    const res = await fetch(`/api/admin/members/${userId}/culture-fluid/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "更新に失敗しました");
    }
  };

  // 各ステップクリック時の処理
  const handleStepClick = async (order: Props["orders"][number], stepKey: string) => {
    if (loadingOrder) return;
    const done = isStepDone(order, stepKey);
    if (done) return; // 既に完了済みのステップは操作不可

    switch (stepKey) {
      case "PAYMENT_CONFIRMED": {
        setLoadingOrder(order.id);
        try {
          await patchOrder(order.id, { paymentStatus: "COMPLETED" });
          router.refresh();
        } catch {
          // エラーは静かに処理
        } finally {
          setLoadingOrder(null);
        }
        break;
      }
      case "PRODUCING": {
        setInputProducedDate(new Date().toISOString().split("T")[0]);
        setShowProducedPopup(order.id);
        break;
      }
      case "CLINIC_BOOKING": {
        setInputClinicDate("");
        setInputClinicName("");
        setInputClinicAddress("");
        setInputClinicPhone("");
        setShowClinicPopup(order.id);
        break;
      }
      case "RESERVATION_CONFIRMED": {
        setLoadingOrder(order.id);
        try {
          await patchOrder(order.id, { status: "RESERVATION_CONFIRMED" });
          router.refresh();
        } catch {
          // エラーは静かに処理
        } finally {
          setLoadingOrder(null);
        }
        break;
      }
      case "COMPLETED": {
        setLoadingOrder(order.id);
        try {
          await patchOrder(order.id, { status: "COMPLETED" });
          router.refresh();
        } catch {
          // エラーは静かに処理
        } finally {
          setLoadingOrder(null);
        }
        break;
      }
    }
  };

  // 金額フォーマット
  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("ja-JP").format(amount);

  // 日付フォーマット
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
  };

  return (
    <>
      <div className="space-y-4">
        {orders.map((order) => {
          const badge = STATUS_BADGE[order.status] || { label: order.status, color: "bg-text-muted/20 text-text-muted" };
          const isLoading = loadingOrder === order.id;

          return (
            <div key={order.id} className="bg-bg-secondary border border-border rounded-md overflow-hidden">
              {/* 注文ヘッダー */}
              <div className="px-4 sm:px-6 py-4 border-b border-border flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-text-primary">{order.planLabel}</span>
                <span className="text-sm text-gold font-mono">&yen;{formatAmount(order.totalAmount)}</span>
                <span className="text-xs text-text-muted">{formatDate(order.createdAt)}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                {isLoading && <span className="text-[10px] text-gold animate-pulse ml-auto">更新中...</span>}
              </div>

              {/* ステータスチェックリスト */}
              <div className="p-4 sm:p-6 space-y-1">
                {CF_STEPS.map((step) => {
                  const done = isStepDone(order, step.key);
                  const canToggle = step.adminToggle && !done && !isLoading;

                  return (
                    <div
                      key={step.key}
                      onClick={() => canToggle ? handleStepClick(order, step.key) : undefined}
                      className={`flex items-center gap-3 py-3.5 px-3 rounded transition-colors ${
                        canToggle ? "cursor-pointer hover:bg-bg-elevated" : ""
                      }`}
                    >
                      {/* チェックボックス */}
                      <div
                        className={`w-8 h-8 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          done
                            ? "bg-gold border-gold"
                            : canToggle
                            ? "border-text-muted/40 hover:border-gold/60"
                            : "border-border"
                        }`}
                      >
                        {done && (
                          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path d="M4 9L7.5 12.5L14 5.5" stroke="#070709" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      {/* ラベル */}
                      <span className={`text-sm ${done ? "text-gold font-medium" : "text-text-muted"}`}>
                        {step.label}
                      </span>

                      {/* 会員操作ヒント（非admin切替ステップ） */}
                      {!step.adminToggle && !done && (
                        <span className="text-[10px] text-text-muted ml-auto">会員本人が操作</span>
                      )}

                      {/* 精製日・有効期限の表示 */}
                      {step.key === "PRODUCING" && order.producedAt && (
                        <span className="text-[10px] text-text-muted ml-auto font-mono">
                          精製: {formatDate(order.producedAt)}
                          {order.expiresAt && ` / 期限: ${formatDate(order.expiresAt)}`}
                        </span>
                      )}

                      {/* クリニック情報の表示 */}
                      {step.key === "CLINIC_BOOKING" && order.clinicDate && (
                        <span className="text-[10px] text-text-muted ml-auto font-mono">
                          {formatDate(order.clinicDate)} {order.clinicName || ""}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 精製日付入力ポップアップ */}
      {showProducedPopup && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowProducedPopup(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-bg-secondary border border-border-gold rounded-xl p-6 sm:p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif-jp text-base text-gold tracking-wider mb-2">精製・管理保管</h3>
            <p className="text-xs text-text-muted mb-5">精製日を入力してください。有効期限はサーバー側で自動計算されます。</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1">精製日</label>
                <input
                  type="date"
                  value={inputProducedDate}
                  onChange={(e) => setInputProducedDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowProducedPopup(null)}
                  className="px-4 py-2.5 border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all"
                >
                  キャンセル
                </button>
                <button
                  onClick={async () => {
                    if (!inputProducedDate || !showProducedPopup) return;
                    setProducedLoading(true);
                    try {
                      await patchOrder(showProducedPopup, {
                        producedAt: new Date(inputProducedDate).toISOString(),
                      });
                      setShowProducedPopup(null);
                      router.refresh();
                    } catch {
                      // エラーは静かに処理
                    } finally {
                      setProducedLoading(false);
                    }
                  }}
                  disabled={producedLoading || !inputProducedDate}
                  className="flex-1 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {producedLoading ? "更新中..." : "確定する"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* クリニック予約ポップアップ */}
      {showClinicPopup && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowClinicPopup(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-bg-secondary border border-border-gold rounded-xl p-6 sm:p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif-jp text-base text-gold tracking-wider mb-2">クリニック予約手配</h3>
            <p className="text-xs text-text-muted mb-5">施術日とクリニック情報を入力してください。</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1">施術予定日</label>
                <input
                  type="date"
                  value={inputClinicDate}
                  onChange={(e) => setInputClinicDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">クリニック名</label>
                <input
                  type="text"
                  value={inputClinicName}
                  onChange={(e) => setInputClinicName(e.target.value)}
                  placeholder="クリニック名を入力"
                  className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">住所</label>
                <input
                  type="text"
                  value={inputClinicAddress}
                  onChange={(e) => setInputClinicAddress(e.target.value)}
                  placeholder="住所を入力"
                  className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">電話番号</label>
                <input
                  type="tel"
                  value={inputClinicPhone}
                  onChange={(e) => setInputClinicPhone(e.target.value)}
                  placeholder="電話番号を入力"
                  className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowClinicPopup(null)}
                  className="px-4 py-2.5 border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all"
                >
                  キャンセル
                </button>
                <button
                  onClick={async () => {
                    if (!inputClinicDate || !inputClinicName || !showClinicPopup) return;
                    setClinicLoading(true);
                    try {
                      await patchOrder(showClinicPopup, {
                        clinicDate: new Date(inputClinicDate).toISOString(),
                        clinicName: inputClinicName,
                        clinicAddress: inputClinicAddress || null,
                        clinicPhone: inputClinicPhone || null,
                        status: "CLINIC_BOOKING",
                      });
                      setShowClinicPopup(null);
                      router.refresh();
                    } catch {
                      // エラーは静かに処理
                    } finally {
                      setClinicLoading(false);
                    }
                  }}
                  disabled={clinicLoading || !inputClinicDate || !inputClinicName}
                  className="flex-1 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {clinicLoading ? "保存中..." : "確定する"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
