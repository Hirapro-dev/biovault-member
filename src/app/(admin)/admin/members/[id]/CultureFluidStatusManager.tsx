"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { getTotalSessions, isAllSessionsCompleted } from "@/lib/culture-fluid-plans";

type Clinic = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  isActive: boolean;
};

// フェーズ1：保管まで（4ステップ）
const PHASE1_STEPS = [
  { key: "APPLIED", label: "追加購入申込み", adminToggle: false },
  { key: "PAYMENT_CONFIRMED", label: "入金確認", adminToggle: true },
  { key: "PRODUCING", label: "iPS培養上清液の精製", adminToggle: true },
  { key: "STORAGE", label: "iPS培養上清液の管理保管", adminToggle: false },
] as const;

// フェーズ2：施術まで（4ステップ）
const PHASE2_STEPS = [
  { key: "CLINIC_BOOKING", label: "クリニックの施術予約", adminToggle: true },
  { key: "INFORMED_AGREED", label: "事前説明・同意", adminToggle: false },
  { key: "RESERVATION_CONFIRMED", label: "予約確定", adminToggle: true },
  { key: "COMPLETED", label: "施術完了", adminToggle: true },
] as const;

// フェーズ2のDB status 順序（進行判定用）
const PHASE2_DB_ORDER = ["CLINIC_BOOKING", "INFORMED_AGREED", "RESERVATION_CONFIRMED", "COMPLETED"];

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
    paidAt: string | null;
    producedAt: string | null;
    expiresAt: string | null;
    clinicDate: string | null;
    clinicName: string | null;
    clinicAddress: string | null;
    clinicPhone: string | null;
    cautionAgreedAt: string | null;
    informedAgreedAt: string | null;
    completedAt: string | null;
    completedSessions: number;
    requestedSessionCount: number;
    sessionDates: string | null;
    createdAt: string;
  }[];
  /** 閲覧専用モード（従業員・代理店ページから利用される） */
  readOnly?: boolean;
}

export default function CultureFluidStatusManager({ userId, orders, readOnly = false }: Props) {
  const router = useRouter();
  const [loadingOrder, setLoadingOrder] = useState<string | null>(null);

  // 入金確認ポップアップ
  const [showPaymentPopup, setShowPaymentPopup] = useState<string | null>(null);
  const [inputPaidDate, setInputPaidDate] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

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
  const [clinicList, setClinicList] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState("");

  // 施術完了ポップアップ
  const [showCompletedPopup, setShowCompletedPopup] = useState<string | null>(null);
  const [inputCompletedDate, setInputCompletedDate] = useState("");
  const [completedLoading, setCompletedLoading] = useState(false);

  // 予約確定ポップアップ（確定日＋クリニック選択）
  const [showReservationPopup, setShowReservationPopup] = useState<string | null>(null);
  const [reservationLoading, setReservationLoading] = useState(false);

  // クリニック予約 or 予約確定ポップアップが開いた時にクリニック一覧を取得
  useEffect(() => {
    if (showClinicPopup || showReservationPopup) {
      fetch("/api/admin/clinics")
        .then((r) => r.json())
        .then((data) => {
          setClinicList(Array.isArray(data) ? data.filter((c: Clinic) => c.isActive) : []);
        })
        .catch(() => setClinicList([]));
    }
  }, [showClinicPopup, showReservationPopup]);

  // 注文が無い場合
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-bg-secondary border border-border rounded-md p-6">
        <p className="text-sm text-text-muted text-center">培養上清液の注文はありません</p>
      </div>
    );
  }

  // フェーズ1のステップ完了判定
  const isPhase1StepDone = (order: Props["orders"][number], stepKey: string): boolean => {
    switch (stepKey) {
      case "APPLIED":
        return true;
      case "PAYMENT_CONFIRMED":
        return order.paymentStatus === "COMPLETED";
      case "PRODUCING":
        return !!order.producedAt;
      case "STORAGE":
        return !!order.producedAt && !!order.expiresAt;
      default:
        return false;
    }
  };

  // フェーズ2のステップ完了判定
  // 施術完了後に残回数がある場合は status が CLINIC_BOOKING に戻るため、
  // その場合はフェーズ2のすべてのステップが未完了として扱う
  const isPhase2StepDone = (order: Props["orders"][number], stepKey: string): boolean => {
    const isPhase1Complete = isPhase1StepDone(order, "STORAGE");
    if (!isPhase1Complete) return false;

    const statusIdx = PHASE2_DB_ORDER.indexOf(order.status);
    if (statusIdx === -1) return false;
    const stepIdx = PHASE2_DB_ORDER.indexOf(stepKey);
    return stepIdx !== -1 && statusIdx >= stepIdx;
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
  const handleStepClick = async (order: Props["orders"][number], stepKey: string, phase: 1 | 2) => {
    if (loadingOrder) return;
    const done = phase === 1 ? isPhase1StepDone(order, stepKey) : isPhase2StepDone(order, stepKey);
    if (done) return; // 既に完了済みのステップは操作不可

    switch (stepKey) {
      case "PAYMENT_CONFIRMED": {
        setInputPaidDate(new Date().toISOString().split("T")[0]);
        setShowPaymentPopup(order.id);
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
        setSelectedClinicId("");
        setShowClinicPopup(order.id);
        break;
      }
      case "RESERVATION_CONFIRMED": {
        // 予約確定: 確定日＋クリニック選択ポップアップ（CLINIC_BOOKING と同じ UI を再利用）
        // 既に clinicDate / clinicName が設定されていればデフォルト値として入れる
        setInputClinicDate(order.clinicDate ? order.clinicDate.split("T")[0] : "");
        setInputClinicName(order.clinicName || "");
        setInputClinicAddress(order.clinicAddress || "");
        setInputClinicPhone(order.clinicPhone || "");
        setSelectedClinicId("");
        setShowReservationPopup(order.id);
        break;
      }
      case "COMPLETED": {
        setInputCompletedDate(new Date().toISOString().split("T")[0]);
        setShowCompletedPopup(order.id);
        break;
      }
    }
  };

  // 「次の予約をする」アクション
  const handleNextSession = async (orderId: string) => {
    if (loadingOrder) return;
    setLoadingOrder(orderId);
    try {
      await patchOrder(orderId, { action: "next_session" });
      router.refresh();
    } catch {
      // エラーは静かに処理
    } finally {
      setLoadingOrder(null);
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

  // 共通のステップ行レンダラー
  const renderStep = (
    order: Props["orders"][number],
    step: { key: string; label: string; adminToggle: boolean },
    phase: 1 | 2,
    isLoading: boolean
  ) => {
    const done = phase === 1 ? isPhase1StepDone(order, step.key) : isPhase2StepDone(order, step.key);
    const canToggle = step.adminToggle && !done && !isLoading && !readOnly;

    return (
      <div
        key={step.key}
        onClick={() => canToggle ? handleStepClick(order, step.key, phase) : undefined}
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
        {!step.adminToggle && !done && step.key !== "APPLIED" && step.key !== "STORAGE" && (
          <span className="text-[10px] text-text-muted ml-auto">会員本人が操作</span>
        )}

        {/* 入金日の表示 */}
        {step.key === "PAYMENT_CONFIRMED" && order.paidAt && (
          <span className="text-[10px] text-text-muted ml-auto font-mono">
            入金: {formatDate(order.paidAt)}
          </span>
        )}

        {/* 精製日の表示 */}
        {step.key === "PRODUCING" && order.producedAt && (
          <span className="text-[10px] text-text-muted ml-auto font-mono">
            精製: {formatDate(order.producedAt)}
          </span>
        )}

        {/* 管理期限の表示 */}
        {step.key === "STORAGE" && order.expiresAt && (
          <span className="text-[10px] text-text-muted ml-auto font-mono">
            期限: {formatDate(order.expiresAt)}
          </span>
        )}

        {/* クリニック情報の表示 */}
        {step.key === "CLINIC_BOOKING" && (
          <span className="text-[10px] text-text-muted ml-auto font-mono">
            {order.requestedSessionCount > 1 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-gold/15 text-gold border border-gold/20 mr-1.5 not-italic">
                {order.requestedSessionCount}回分
              </span>
            )}
            {order.clinicDate && <>{formatDate(order.clinicDate)} {order.clinicName || ""}</>}
          </span>
        )}

        {/* 施術完了日の表示 */}
        {step.key === "COMPLETED" && order.completedAt && (
          <span className="text-[10px] text-text-muted ml-auto font-mono">
            完了: {formatDate(order.completedAt)}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {orders.map((order) => {
          const badge = STATUS_BADGE[order.status] || { label: order.status, color: "bg-text-muted/20 text-text-muted" };
          const isLoading = loadingOrder === order.id;
          const totalSessions = getTotalSessions(order.planType);
          const currentSession = Math.min((order.completedSessions ?? 0) + 1, totalSessions);
          const isPhase1Complete = isPhase1StepDone(order, "STORAGE");
          const allCompleted = isAllSessionsCompleted(order.planType, order.completedSessions ?? 0);
          // 「次の予約をする」ボタン表示条件:
          // - 全体は未完了（残回数あり）
          // - status が CLINIC_BOOKING に戻っている
          // - かつ 2回目以降（= completedSessions >= 1）
          const showNextSessionButton =
            !allCompleted &&
            order.status === "CLINIC_BOOKING" &&
            (order.completedSessions ?? 0) >= 1 &&
            !order.clinicDate &&
            !order.informedAgreedAt;

          return (
            <div key={order.id} className="bg-bg-secondary border border-border rounded-md overflow-hidden">
              {/* 注文ヘッダー */}
              <div className="px-4 sm:px-6 py-4 border-b border-border flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-text-primary">{order.planLabel}</span>
                <span className="text-sm text-gold font-mono">&yen;{formatAmount(order.totalAmount)}</span>
                <span className="text-xs text-text-muted">{formatDate(order.createdAt)}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                {totalSessions > 1 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/20">
                    {order.completedSessions ?? 0} / {totalSessions} 回完了
                  </span>
                )}
                {isLoading && <span className="text-[10px] text-gold animate-pulse ml-auto">更新中...</span>}
              </div>

              {/* 施術履歴（sessionDates がある場合） */}
              {order.sessionDates && (() => {
                const dates: string[] = JSON.parse(order.sessionDates as string);
                return dates.length > 0 ? (
                  <div className="px-4 sm:px-6 py-3 border-b border-border bg-bg-elevated/50">
                    <div className="text-[10px] text-text-muted mb-1.5">施術履歴</div>
                    <div className="space-y-0.5">
                      {dates.map((d, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px]">
                          <span className="text-gold font-mono">{idx + 1}/{totalSessions}回目</span>
                          <span className="text-text-muted">:</span>
                          <span className="text-text-secondary font-mono">{d}</span>
                        </div>
                      ))}
                      {Array.from({ length: totalSessions - dates.length }).map((_, idx) => (
                        <div key={`p-${idx}`} className="flex items-center gap-2 text-[11px]">
                          <span className="text-text-muted font-mono">{dates.length + idx + 1}/{totalSessions}回目</span>
                          <span className="text-text-muted">:</span>
                          <span className="text-text-muted">---</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* フェーズ1：保管まで */}
              <div className="px-4 sm:px-6 pt-4 pb-1">
                <div className="text-[11px] text-gold tracking-wider mb-1">フェーズ1：保管まで</div>
              </div>
              <div className="px-4 sm:px-6 pb-4 space-y-1">
                {PHASE1_STEPS.map((step) => renderStep(order, step, 1, isLoading))}
              </div>

              {/* フェーズ2：施術まで */}
              <div className="px-4 sm:px-6 pt-2 pb-1 border-t border-border">
                <div className="flex items-center gap-2 mt-3 mb-1">
                  <div className="text-[11px] text-gold tracking-wider">フェーズ2：施術まで</div>
                  {totalSessions > 1 && isPhase1Complete && !allCompleted && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/20 ml-auto">
                      {currentSession}回目 / 全{totalSessions}回
                    </span>
                  )}
                </div>
              </div>
              <div className="px-4 sm:px-6 pb-4 space-y-1">
                {isPhase1Complete ? (
                  <>
                    {PHASE2_STEPS.map((step) => renderStep(order, step, 2, isLoading))}
                    {/* 「次の予約をする」ボタン（2回目以降かつ未着手時） */}
                    {showNextSessionButton && !readOnly && (
                      <div className="pt-3 mt-2 border-t border-border">
                        <button
                          onClick={() => handleNextSession(order.id)}
                          disabled={isLoading}
                          className="w-full py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50 hover:opacity-90 transition-all"
                        >
                          {isLoading ? "処理中..." : `次の予約をする（${currentSession}回目）`}
                        </button>
                        <p className="text-[10px] text-text-muted mt-2 text-center">
                          前回の施術が完了しました。次回の施術サイクルを開始します。
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-4 text-center text-xs text-text-muted">
                    フェーズ1の「管理保管」完了後に操作可能になります
                  </div>
                )}
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
                <label className="block text-xs text-text-secondary mb-1">精製完了日</label>
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
            <p className="text-xs text-text-muted mb-5">施術日とクリニックを選択してください。</p>

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
                <label className="block text-xs text-text-secondary mb-1">提携クリニック</label>
                <select
                  value={selectedClinicId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedClinicId(id);
                    const clinic = clinicList.find((c) => c.id === id);
                    if (clinic) {
                      setInputClinicName(clinic.name);
                      setInputClinicAddress(clinic.address || "");
                      setInputClinicPhone(clinic.phone || "");
                    } else {
                      setInputClinicName("");
                      setInputClinicAddress("");
                      setInputClinicPhone("");
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none cursor-pointer"
                >
                  <option value="">クリニックを選択</option>
                  {clinicList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {selectedClinicId && (
                <div className="bg-bg-elevated border border-border rounded-md p-3 space-y-1.5">
                  <div className="text-sm text-text-primary font-medium">{inputClinicName}</div>
                  {inputClinicAddress && <div className="text-xs text-text-muted">{inputClinicAddress}</div>}
                  {inputClinicPhone && <div className="text-xs text-text-muted">TEL: {inputClinicPhone}</div>}
                </div>
              )}
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

      {/* 入金確認ポップアップ */}
      {showPaymentPopup && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowPaymentPopup(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-bg-secondary border border-border-gold rounded-xl p-6 sm:p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif-jp text-base text-gold tracking-wider mb-2">入金確認</h3>
            <p className="text-xs text-text-muted mb-5">入金を確認した日付を入力してください。</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1">入金日</label>
                <input
                  type="date"
                  value={inputPaidDate}
                  onChange={(e) => setInputPaidDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowPaymentPopup(null)}
                  className="px-4 py-2.5 border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all"
                >
                  キャンセル
                </button>
                <button
                  onClick={async () => {
                    if (!inputPaidDate || !showPaymentPopup) return;
                    setPaymentLoading(true);
                    try {
                      await patchOrder(showPaymentPopup, {
                        paymentStatus: "COMPLETED",
                        paidAt: new Date(inputPaidDate).toISOString(),
                      });
                      setShowPaymentPopup(null);
                      router.refresh();
                    } catch {
                      // エラーは静かに処理
                    } finally {
                      setPaymentLoading(false);
                    }
                  }}
                  disabled={paymentLoading || !inputPaidDate}
                  className="flex-1 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {paymentLoading ? "更新中..." : "確定する"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 施術完了ポップアップ */}
      {showCompletedPopup && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowCompletedPopup(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-bg-secondary border border-border-gold rounded-xl p-6 sm:p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif-jp text-base text-gold tracking-wider mb-2">施術完了</h3>
            <p className="text-xs text-text-muted mb-5">施術が完了した日付を入力してください。</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1">完了日</label>
                <input
                  type="date"
                  value={inputCompletedDate}
                  onChange={(e) => setInputCompletedDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowCompletedPopup(null)}
                  className="px-4 py-2.5 border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all"
                >
                  キャンセル
                </button>
                <button
                  onClick={async () => {
                    if (!inputCompletedDate || !showCompletedPopup) return;
                    setCompletedLoading(true);
                    try {
                      await patchOrder(showCompletedPopup, {
                        completedAt: new Date(inputCompletedDate).toISOString(),
                      });
                      setShowCompletedPopup(null);
                      router.refresh();
                    } catch {
                      // エラーは静かに処理
                    } finally {
                      setCompletedLoading(false);
                    }
                  }}
                  disabled={completedLoading || !inputCompletedDate}
                  className="flex-1 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {completedLoading ? "更新中..." : "確定する"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 予約確定ポップアップ（確定日＋クリニック選択） */}
      {showReservationPopup && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowReservationPopup(null)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative bg-bg-secondary border border-border-gold rounded-xl p-6 sm:p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif-jp text-base text-gold tracking-wider mb-2">予約確定</h3>
            <p className="text-xs text-text-muted mb-5">施術の確定日とクリニックを選択してください。</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1">確定日</label>
                <input
                  type="date"
                  value={inputClinicDate}
                  onChange={(e) => setInputClinicDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm font-mono outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">提携クリニック</label>
                <select
                  value={selectedClinicId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedClinicId(id);
                    const clinic = clinicList.find((c) => c.id === id);
                    if (clinic) {
                      setInputClinicName(clinic.name);
                      setInputClinicAddress(clinic.address || "");
                      setInputClinicPhone(clinic.phone || "");
                    } else {
                      setInputClinicName("");
                      setInputClinicAddress("");
                      setInputClinicPhone("");
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-bg-elevated border border-border rounded-sm text-text-primary text-sm outline-none cursor-pointer"
                >
                  <option value="">クリニックを選択</option>
                  {clinicList.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {selectedClinicId && (
                <div className="bg-bg-elevated border border-border rounded-md p-3 space-y-1.5">
                  <div className="text-sm text-text-primary font-medium">{inputClinicName}</div>
                  {inputClinicAddress && <div className="text-xs text-text-muted">{inputClinicAddress}</div>}
                  {inputClinicPhone && <div className="text-xs text-text-muted">TEL: {inputClinicPhone}</div>}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowReservationPopup(null)}
                  className="px-4 py-2.5 border border-border text-text-secondary rounded-sm text-sm cursor-pointer hover:border-border-gold transition-all"
                >
                  キャンセル
                </button>
                <button
                  onClick={async () => {
                    if (!inputClinicDate || !inputClinicName || !showReservationPopup) return;
                    setReservationLoading(true);
                    try {
                      await patchOrder(showReservationPopup, {
                        clinicDate: new Date(inputClinicDate).toISOString(),
                        clinicName: inputClinicName,
                        clinicAddress: inputClinicAddress || null,
                        clinicPhone: inputClinicPhone || null,
                        status: "RESERVATION_CONFIRMED",
                      });
                      setShowReservationPopup(null);
                      router.refresh();
                    } catch {
                      // エラーは静かに処理
                    } finally {
                      setReservationLoading(false);
                    }
                  }}
                  disabled={reservationLoading || !inputClinicDate || !inputClinicName}
                  className="flex-1 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-[13px] font-semibold tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {reservationLoading ? "確定中..." : "予約を確定する"}
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
