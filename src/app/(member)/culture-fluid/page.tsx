import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { getTotalSessions, getRemainingSessions, isAllSessionsCompleted } from "@/lib/culture-fluid-plans";

// フェーズ1：保管まで（4ステップ）
const PHASE1_STEPS = [
  { key: "APPLIED", label: "iPS培養上清液の追加購入申込み", icon: "🧪" },
  { key: "PAYMENT_CONFIRMED", label: "指定振込先へのご入金", icon: "💰" },
  { key: "PRODUCING", label: "iPS培養上清液の精製", icon: "⚗️" },
  { key: "STORAGE", label: "iPS培養上清液の管理保管", icon: "🏛️" },
] as const;

// フェーズ2：施術まで（4ステップ）
const PHASE2_STEPS = [
  { key: "CLINIC_BOOKING", label: "クリニックの施術予約", icon: "📅" },
  { key: "INFORMED_AGREED", label: "iPS培養上清液のご利用に関する事前説明・同意", icon: "📄" },
  { key: "RESERVATION_CONFIRMED", label: "予約確定", icon: "🏥" },
  { key: "COMPLETED", label: "施術完了", icon: "✓" },
] as const;

// フェーズ2ステップ順序（DB上の status 文字列での並び）
// フェーズ1は producedAt / expiresAt / paymentStatus で個別判定するため配列不要
const PHASE2_DB_ORDER = ["CLINIC_BOOKING", "INFORMED_AGREED", "RESERVATION_CONFIRMED", "COMPLETED"];

const formatDate = (d: Date | string | null) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
};

export default async function CultureFluidPage() {
  const user = await requireAuth();

  const orders = await prisma.cultureFluidOrder.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const defaultBank = await prisma.bankAccount.findFirst({ where: { isDefault: true, isActive: true } });

  // 完了済み施術回数の合計（全注文のcompletedSessionsの合計）
  const completedCount = orders.reduce((sum, o) => sum + (o.completedSessions ?? 0), 0);

  // アクティブな注文 = 全施術が完了していない注文
  const activeOrder = orders.find((o) => !isAllSessionsCompleted(o.planType, o.completedSessions ?? 0)) || null;

  // プラン情報
  const totalSessions = activeOrder ? getTotalSessions(activeOrder.planType) : 0;
  const completedSessions = activeOrder?.completedSessions ?? 0;
  const remainingSessions = activeOrder ? getRemainingSessions(activeOrder.planType, completedSessions) : 0;
  const currentSession = Math.min(completedSessions + 1, totalSessions); // 現在「何回目」の施術か

  // フェーズ1のステップ完了判定
  // - PRODUCING（精製）: producedAt が設定されたら完了
  // - STORAGE（管理保管）: producedAt かつ expiresAt が設定されていれば完了
  //   （API側で精製完了と同時に両方セットされるため）
  const isPhase1StepDone = (key: string): boolean => {
    if (!activeOrder) return false;
    switch (key) {
      case "APPLIED":
        // 注文作成時点で完了
        return true;
      case "PAYMENT_CONFIRMED":
        return activeOrder.paymentStatus === "COMPLETED";
      case "PRODUCING":
        return !!activeOrder.producedAt;
      case "STORAGE":
        return !!activeOrder.producedAt && !!activeOrder.expiresAt;
      default:
        return false;
    }
  };

  // フェーズ1全体が完了しているか（= フェーズ2表示可否）
  const isPhase1Complete = isPhase1StepDone("STORAGE");

  // フェーズ2のステップ完了判定
  // 施術完了後に残回数がある場合は status が CLINIC_BOOKING に戻るため、
  // その場合はフェーズ2のすべてのステップが未完了として扱う
  const isPhase2StepDone = (key: string): boolean => {
    if (!activeOrder || !isPhase1Complete) return false;
    const statusIdx = PHASE2_DB_ORDER.indexOf(activeOrder.status);
    if (statusIdx === -1) return false;
    const stepIdx = PHASE2_DB_ORDER.indexOf(key);
    return stepIdx !== -1 && statusIdx >= stepIdx;
  };

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        培養上清液サービス詳細
      </h2>

      {/* ── 1. 保有状況カード ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-bg-secondary border border-border rounded-md p-5">
          <div className="text-[10px] text-text-muted tracking-wider mb-1">施術完了回数</div>
          <div className="font-mono text-2xl text-gold">{completedCount}<span className="text-sm text-text-muted ml-1">回</span></div>
          <div className="text-[10px] text-text-muted mt-1">累計完了済み</div>
        </div>
        <div className="bg-bg-secondary border border-border rounded-md p-5">
          <div className="text-[10px] text-text-muted tracking-wider mb-1">残り施術回数</div>
          {activeOrder ? (
            <>
              <div className="font-mono text-2xl text-gold">
                {remainingSessions}
                <span className="text-sm text-text-muted ml-1">／ {totalSessions} 回</span>
              </div>
              <div className="text-[10px] text-text-muted mt-1">{activeOrder.planLabel}</div>
            </>
          ) : (
            <div className="text-sm text-text-muted">---</div>
          )}
        </div>
        <div className="bg-bg-secondary border border-border rounded-md p-5">
          <div className="text-[10px] text-text-muted tracking-wider mb-1">管理期限</div>
          {activeOrder?.expiresAt ? (
            <>
              <div className="font-mono text-lg text-gold">{formatDate(activeOrder.expiresAt)}</div>
              <div className="text-[10px] text-text-muted mt-1">精製日より約8ヶ月</div>
            </>
          ) : (
            <div className="text-sm text-text-muted">---</div>
          )}
        </div>
      </div>

      {/* ── 2. 追加申込ボタン ── */}
      <div className="mb-6">
        <Link href="/culture-fluid/apply" className="block group">
          <div className="rounded-xl border border-border-gold overflow-hidden hover:shadow-[0_0_20px_rgba(191,160,75,0.1)] transition-all"
               style={{ background: "linear-gradient(135deg, rgba(191,160,75,0.10) 0%, rgba(191,160,75,0.02) 100%)" }}>
            <div className="flex items-center gap-4 px-5 py-5">
              <div className="w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0"
                   style={{ background: "linear-gradient(135deg, rgba(191,160,75,0.20) 0%, rgba(191,160,75,0.08) 100%)", border: "1px solid rgba(191,160,75,0.25)" }}>
                🧪
              </div>
              <div className="flex-1">
                <div className="text-sm text-gold font-semibold tracking-wide">iPS培養上清液の追加購入申込</div>
                <div className="text-[11px] text-text-muted mt-0.5">点滴・注射プランを選択して申込</div>
              </div>
              <span className="text-gold text-xs group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </Link>
      </div>

      {/* ── 3. 次のステップ ── */}
      {activeOrder && (
        <div className="mb-6">
          <h3 className="font-serif-jp text-base sm:text-lg font-normal text-text-primary tracking-wider mb-4 mt-2 pb-3 border-b border-border">
            次のステップ
          </h3>

          {/* 入金待ち */}
          {activeOrder.status === "APPLIED" && (
            <div className="rounded-xl border border-border-gold overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(191,160,75,0.08) 0%, rgba(191,160,75,0.02) 100%)" }}>
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">💰</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/20">NEXT</span>
                </div>
                <div className="text-base sm:text-lg text-text-primary font-medium mb-2">指定振込先へのご入金</div>
                <div className="text-xs text-text-muted leading-relaxed mb-4">お申込みありがとうございます。入金の確認が取れ次第、精製工程に進みます。</div>
                <div className="bg-bg-elevated border border-border rounded-md p-4 space-y-3">
                  <div>
                    <div className="text-[11px] text-text-muted mb-1">お支払い金額</div>
                    <div className="font-mono text-lg text-gold">¥{activeOrder.totalAmount.toLocaleString()}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">{activeOrder.planLabel}</div>
                  </div>
                  {activeOrder.paymentDate && (
                    <div>
                      <div className="text-[11px] text-text-muted mb-1">入金予定日</div>
                      <div className="text-sm text-text-primary font-mono">{formatDate(activeOrder.paymentDate)}</div>
                    </div>
                  )}
                  {defaultBank && (
                    <div className="border-t border-border pt-3">
                      <div className="text-[11px] text-text-muted mb-2">お振込先</div>
                      <div className="text-xs text-text-primary leading-relaxed space-y-0.5">
                        <div>{defaultBank.bankName} {defaultBank.branchName}</div>
                        <div>{defaultBank.accountType} {defaultBank.accountNumber}</div>
                        <div>{defaultBank.accountName}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 精製中 */}
          {activeOrder.status === "PAYMENT_CONFIRMED" && (
            <div className="rounded-xl border border-border-gold overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(191,160,75,0.08) 0%, rgba(191,160,75,0.02) 100%)" }}>
              <div className="p-5 sm:p-6 text-center">
                <div className="text-4xl mb-3">⚗️</div>
                <div className="text-base sm:text-lg text-gold font-medium mb-2">iPS培養上清液を精製中</div>
                <div className="text-xs text-text-muted leading-relaxed">入金確認が完了しました。精製が完了次第、次のステップへ進みます。<br />通常は約1ヶ月を目安に精製手続きが進行します。</div>
              </div>
            </div>
          )}

          {/* クリニック予約 */}
          {activeOrder.status === "PRODUCING" && (
            <div className="rounded-xl border border-border-gold overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(191,160,75,0.08) 0%, rgba(191,160,75,0.02) 100%)" }}>
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">📅</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/20">NEXT</span>
                </div>
                <div className="text-base sm:text-lg text-text-primary font-medium mb-2">クリニックの施術予約</div>
                <div className="text-xs text-text-muted leading-relaxed mb-4">精製が完了しました。担当者経由でクリニックの予約を手配いたします。</div>
                {activeOrder.expiresAt && (
                  <div className="bg-bg-elevated border border-border rounded-md p-3">
                    <div className="text-[11px] text-text-muted mb-1">管理期限</div>
                    <div className="font-mono text-sm text-gold">{formatDate(activeOrder.expiresAt)}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">※ 精製日より約8ヶ月。期限内にご利用ください。</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 事前説明・同意 */}
          {activeOrder.status === "CLINIC_BOOKING" && !activeOrder.informedAgreedAt && (
            <Link href={`/culture-fluid/informed-consent?orderId=${activeOrder.id}`} className="block group">
              <div className="rounded-xl border border-status-warning/30 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(251,191,36,0.02) 100%)" }}>
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📄</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-warning/15 text-status-warning border border-status-warning/20">要同意</span>
                    {completedSessions > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/20">
                        {currentSession}回目 / 全{totalSessions}回
                      </span>
                    )}
                  </div>
                  <div className="text-base sm:text-lg text-text-primary font-medium mb-2">iPS培養上清液のご利用に関する事前説明・同意</div>
                  <div className="text-xs text-status-warning leading-relaxed mb-1">※ 施術前にご同意が必要です</div>
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold tracking-wider group-hover:scale-[1.02] transition-all mt-3" style={{ background: "linear-gradient(135deg, #BFA04B, #D4B856)", color: "#070709" }}>
                    同意書を確認する <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* 予約確定 */}
          {activeOrder.status === "RESERVATION_CONFIRMED" && activeOrder.clinicDate && (
            <div className="rounded-xl border border-border-gold overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(191,160,75,0.08) 0%, rgba(191,160,75,0.02) 100%)" }}>
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🏥</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/20">確定</span>
                </div>
                <div className="text-base sm:text-lg text-text-primary font-medium mb-3">施術予約が確定しました</div>
                <div className="bg-bg-elevated border border-border rounded-md p-4 space-y-3">
                  <div>
                    <div className="text-[11px] text-text-muted mb-1">予定日</div>
                    <div className="font-mono text-lg text-gold">{new Date(activeOrder.clinicDate).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}</div>
                  </div>
                  {activeOrder.clinicName && (
                    <div>
                      <div className="text-[11px] text-text-muted mb-1">提携クリニック</div>
                      <div className="text-sm text-text-primary">{activeOrder.clinicName}</div>
                      {activeOrder.clinicAddress && <div className="text-xs text-text-muted mt-1">{activeOrder.clinicAddress}</div>}
                      {activeOrder.clinicPhone && <div className="text-xs text-text-muted mt-1">TEL: {activeOrder.clinicPhone}</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 施術完了（全回数完了時） */}
          {activeOrder.status === "COMPLETED" && (
            <div className="rounded-xl border border-border-gold overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(191,160,75,0.08) 0%, rgba(191,160,75,0.02) 100%)" }}>
              <div className="p-5 sm:p-6 text-center">
                <div className="text-4xl mb-3">✓</div>
                <div className="text-base sm:text-lg text-gold font-medium mb-2">全ての施術が完了しました</div>
                <div className="text-xs text-text-muted leading-relaxed mb-4">
                  {totalSessions}回分の施術がすべて完了しました。<br />
                  次回の施術をご希望の場合は、追加購入からお申込みください。
                </div>
                <Link href="/culture-fluid/apply" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold tracking-wider hover:scale-[1.02] transition-all" style={{ background: "linear-gradient(135deg, #BFA04B, #D4B856)", color: "#070709" }}>
                  追加購入のお申込みへ →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 4-A. フェーズ1：保管までのステータス ──
          注文がなくても常に表示し、注文前は第1ステップ「申込み」がアクティブ点滅 */}
      <div className="flex items-center gap-2 mb-4 mt-2 pb-3 border-b border-border">
        <h3 className="font-serif-jp text-base sm:text-lg font-normal text-text-primary tracking-wider">
          フェーズ1：保管までのステータス
        </h3>
      </div>
      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6 mb-6">
        <div className="relative">
          {PHASE1_STEPS.map((step, i) => {
            const done = isPhase1StepDone(step.key);
            // 注文がない場合は第1ステップ「APPLIED」が常にアクティブ点滅
            const isActive = !activeOrder
              ? i === 0
              : !done && (i === 0 || isPhase1StepDone(PHASE1_STEPS[i - 1]?.key));
            const isLast = i === PHASE1_STEPS.length - 1;
            const nextDone = !isLast && isPhase1StepDone(PHASE1_STEPS[i + 1].key);

            return (
              <div key={step.key} className={`flex items-start gap-4 relative ${isLast ? "" : "pb-6"}`}>
                {!isLast && (
                  <div className="absolute left-[15px] top-[32px] bottom-0 w-[2px] z-[1]"
                       style={{ background: done && nextDone ? "var(--color-gold-primary)" : done && !nextDone ? "linear-gradient(to bottom, var(--color-gold-primary), var(--color-border))" : "var(--color-border)" }} />
                )}
                <div className={`relative z-[2] w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 text-sm transition-all duration-500 ${
                  done ? "text-bg-primary font-bold" : isActive ? "border-2 border-gold text-gold animate-pulse-gold" : "border border-border text-text-muted"
                }`} style={{
                  background: done ? "linear-gradient(135deg, var(--color-gold-primary), var(--color-gold-light))" : isActive ? "var(--color-bg-primary)" : "var(--color-bg-elevated)",
                }}>
                  {done ? "✓" : step.icon}
                </div>
                <div className="pt-1 min-w-0 flex-1">
                  <div className={`text-[13px] sm:text-sm ${done ? "text-gold" : isActive ? "text-gold-light font-semibold" : "text-text-muted"}`}>
                    {step.label}
                  </div>
                  {step.key === "PRODUCING" && activeOrder?.producedAt && (
                    <div className="text-[10px] text-text-muted font-mono mt-0.5">
                      精製完了：{formatDate(activeOrder.producedAt)}
                    </div>
                  )}
                  {step.key === "STORAGE" && activeOrder?.expiresAt && (
                    <div className="text-[10px] text-text-muted font-mono mt-0.5">
                      管理期限：{formatDate(activeOrder.expiresAt)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4-B. フェーズ2：施術までのステータス ──
          フェーズ1完了後に表示。複数回施術プランの場合は毎施術サイクルで使い回す */}
      {activeOrder && (
        <>
          <div className="flex items-center gap-2 mb-4 mt-2 pb-3 border-b border-border">
            <h3 className="font-serif-jp text-base sm:text-lg font-normal text-text-primary tracking-wider">
              フェーズ2：施術までのステータス
            </h3>
            {totalSessions > 1 && isPhase1Complete && activeOrder.status !== "COMPLETED" && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/20 ml-auto">
                {currentSession}回目 / 全{totalSessions}回
              </span>
            )}
          </div>
          {isPhase1Complete ? (
            <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6 mb-6">
              <div className="relative">
                {PHASE2_STEPS.map((step, i) => {
                  const done = isPhase2StepDone(step.key);
                  const isActive = !done && (i === 0 || isPhase2StepDone(PHASE2_STEPS[i - 1]?.key));
                  const isLast = i === PHASE2_STEPS.length - 1;
                  const nextDone = !isLast && isPhase2StepDone(PHASE2_STEPS[i + 1].key);

                  return (
                    <div key={step.key} className={`flex items-start gap-4 relative ${isLast ? "" : "pb-6"}`}>
                      {!isLast && (
                        <div className="absolute left-[15px] top-[32px] bottom-0 w-[2px] z-[1]"
                             style={{ background: done && nextDone ? "var(--color-gold-primary)" : done && !nextDone ? "linear-gradient(to bottom, var(--color-gold-primary), var(--color-border))" : "var(--color-border)" }} />
                      )}
                      <div className={`relative z-[2] w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 text-sm transition-all duration-500 ${
                        done ? "text-bg-primary font-bold" : isActive ? "border-2 border-gold text-gold animate-pulse-gold" : "border border-border text-text-muted"
                      }`} style={{
                        background: done ? "linear-gradient(135deg, var(--color-gold-primary), var(--color-gold-light))" : isActive ? "var(--color-bg-primary)" : "var(--color-bg-elevated)",
                      }}>
                        {done ? "✓" : step.icon}
                      </div>
                      <div className="pt-1 min-w-0 flex-1">
                        <div className={`text-[13px] sm:text-sm ${done ? "text-gold" : isActive ? "text-gold-light font-semibold" : "text-text-muted"}`}>
                          {step.label}
                        </div>
                        {step.key === "RESERVATION_CONFIRMED" && activeOrder.clinicDate && done && (
                          <div className="text-[10px] text-text-muted font-mono mt-0.5">{formatDate(activeOrder.clinicDate)}</div>
                        )}
                        {step.key === "COMPLETED" && activeOrder.completedAt && done && (
                          <div className="text-[10px] text-text-muted font-mono mt-0.5">{formatDate(activeOrder.completedAt)}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-bg-secondary border border-border rounded-md p-6 sm:p-8 text-center mb-6">
              <div className="text-3xl mb-3 opacity-40">🏥</div>
              <div className="text-sm text-text-muted">フェーズ1の完了後に表示されます</div>
              <div className="text-[11px] text-text-muted mt-1">保管完了後、施術の予約手続きに進めます</div>
            </div>
          )}
        </>
      )}

      {/* ── 5. 注文がない場合 ── */}
      {!activeOrder && orders.length === 0 && (
        <div className="bg-bg-secondary border border-border rounded-md p-8 text-center mb-6">
          <div className="text-3xl mb-3">🧪</div>
          <div className="text-sm text-text-muted">まだ培養上清液のご注文がありません</div>
          <div className="text-xs text-text-muted mt-1">上のボタンから追加購入をお申込みください</div>
        </div>
      )}

      {/* ── 6. 注文履歴 ── */}
      {orders.length > 1 && (
        <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
          <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">注文履歴</h3>
          <div className="divide-y divide-border">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm text-text-primary">{o.planLabel}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">{formatDate(o.createdAt)} ・ ¥{o.totalAmount.toLocaleString()}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${o.status === "COMPLETED" ? "bg-status-active/10 text-status-active border-status-active/20" : "bg-gold/10 text-gold border-gold/20"}`}>
                  {o.status === "COMPLETED" ? "完了" : "進行中"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
