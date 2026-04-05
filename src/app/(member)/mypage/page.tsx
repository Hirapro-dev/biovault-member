import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import ScheduleRequestButton from "./ScheduleRequestButton";

// 表示用ステップの定義
const TIMELINE_STEPS = [
  { key: "TERMS_AGREED", label: "iPS細胞作製適合確認", icon: "📋" },
  { key: "DOC_PRIVACY", label: "重要事項確認／個人情報取扱同意確認", icon: "📜" },
  { key: "REGISTERED", label: "メンバーシップ登録", icon: "👤" },
  { key: "SERVICE_APPLIED", label: "サービス申込", icon: "✍️" },
  { key: "PAYMENT_CONFIRMED", label: "入金確認", icon: "💰" },
  { key: "SCHEDULE_ARRANGED", label: "日程調整", icon: "📅" },
  { key: "DOC_CELL_STORAGE", label: "メンバーシップ契約書", icon: "📋" },
  { key: "DOC_INFORMED", label: "インフォームドコンセント", icon: "📄" },
  { key: "BLOOD_COLLECTED", label: "問診・採血", icon: "💉" },
  { key: "IPS_CREATING", label: "iPS細胞作製中", icon: "🧬" },
  { key: "STORAGE_ACTIVE", label: "iPS細胞保管", icon: "🏛️" },
] as const;

// IpsStatusの順序マッピング（DB上のステータス）
const STATUS_ORDER = [
  "REGISTERED", "TERMS_AGREED", "SERVICE_APPLIED",
  "SCHEDULE_ARRANGED", "BLOOD_COLLECTED", "IPS_CREATING", "STORAGE_ACTIVE",
];

export default async function MyPage() {
  const user = await requireAuth();

  const [fullUser, membership, documents, statusHistories] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        nameRomaji: true,
        hasAgreedTerms: true,
        currentIllness: true, currentIllnessDetail: true,
        pastIllness: true, pastIllnessDetail: true,
        currentMedication: true, currentMedicationDetail: true,
        chronicDisease: true, chronicDiseaseDetail: true,
        infectiousDisease: true, infectiousDiseaseDetail: true,
        pregnancy: true,
        allergy: true, allergyDetail: true,
        otherHealth: true, otherHealthDetail: true,
      },
    }),
    prisma.membership.findUnique({
      where: { userId: user.id },
      include: { treatments: true },
    }),
    prisma.document.findMany({
      where: { userId: user.id },
    }),
    prisma.statusHistory.findMany({
      where: { userId: user.id },
      orderBy: { changedAt: "asc" },
      select: { toStatus: true, changedAt: true },
    }),
  ]);

  // ステータス到達日マッピング
  const statusDates: Record<string, string> = {};
  if (membership) {
    statusDates["REGISTERED"] = membership.contractDate.toISOString();
  }
  for (const h of statusHistories) {
    if (!statusDates[h.toStatus]) {
      statusDates[h.toStatus] = h.changedAt.toISOString();
    }
  }

  // 書類署名日マッピング
  const docSignedMap: Record<string, string | null> = {};
  for (const doc of documents) {
    if (doc.status === "SIGNED" && doc.signedAt) {
      docSignedMap[doc.type] = doc.signedAt.toISOString();
    }
  }

  // 各ステップの完了判定・日付取得
  const currentStatusIndex = membership ? STATUS_ORDER.indexOf(membership.ipsStatus) : -1;

  function isStepDone(key: string): boolean {
    if (key === "DOC_PRIVACY") return !!docSignedMap["PRIVACY_POLICY"] || !!fullUser?.hasAgreedTerms;
    if (key === "DOC_CELL_STORAGE") return !!docSignedMap["CONSENT_CELL_STORAGE"];
    if (key === "DOC_INFORMED") return !!docSignedMap["INFORMED_CONSENT"];
    if (key === "PAYMENT_CONFIRMED") return membership?.paymentStatus === "COMPLETED";
    const idx = STATUS_ORDER.indexOf(key);
    if (idx === -1) return false;
    return currentStatusIndex >= idx;
  }

  function getStepDate(key: string): string | null {
    if (key === "DOC_PRIVACY") return docSignedMap["PRIVACY_POLICY"] || (fullUser?.hasAgreedTerms ? statusDates["TERMS_AGREED"] || null : null);
    if (key === "DOC_CELL_STORAGE") return docSignedMap["CONSENT_CELL_STORAGE"] || null;
    if (key === "DOC_INFORMED") return docSignedMap["INFORMED_CONSENT"] || null;
    if (key === "PAYMENT_CONFIRMED") return membership?.paymentStatus === "COMPLETED" && membership?.updatedAt ? membership.updatedAt.toISOString() : null;
    return statusDates[key] || null;
  }

  function isStepActive(key: string, index: number): boolean {
    // 最初の未完了ステップがアクティブ
    for (let i = 0; i < TIMELINE_STEPS.length; i++) {
      if (!isStepDone(TIMELINE_STEPS[i].key)) return i === index;
    }
    return false;
  }

  // 保管期間
  const storageEndDate = membership?.storageStartAt
    ? (() => {
        const end = new Date(membership.storageStartAt);
        end.setFullYear(end.getFullYear() + membership.storageYears);
        return end;
      })()
    : null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
  };

  return (
    <div>
      {/* ── 1. メンバーカード ── */}
      <div className="mb-6 sm:mb-8" style={{ minWidth: 280, maxWidth: 540 }}>
        <div
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8 w-full aspect-[1.586/1] flex flex-col justify-between border border-white/15"
          style={{ background: "#0A0A0C", boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)" }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "url('/card_bg.jpg')", backgroundSize: "cover", backgroundPosition: "center" }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(160deg, transparent 5%, rgba(255,255,255,0.04) 15%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 95%, transparent 95%)" }} />
          {/* 斜めに流れるシルバーの光 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, transparent 0%, transparent 40%, rgba(255,255,255,0.04) 46%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.04) 54%, transparent 60%, transparent 100%)", backgroundSize: "400% 100%", animation: "card-shine 16s linear infinite" }} />
          </div>
          <style>{`@keyframes card-shine { 0% { background-position: 300% 0; } 100% { background-position: -100% 0; } }`}</style>
          <div className="relative z-10 flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_white.png" alt="BioVault" className="h-6 sm:h-8 w-auto opacity-70" />
            <div className="text-[9px] sm:text-[10px] tracking-[3px] font-light text-white/80">MEMBER</div>
          </div>
          <div className="relative z-10">
            <div className="font-mono text-xl sm:text-2xl tracking-[6px] sm:tracking-[8px]">
              {membership?.memberNumber || "----"}
            </div>
          </div>
          <div className="relative z-10 flex items-end justify-between">
            <div>
              <div className="text-[10px] sm:text-[12px] tracking-[2px] mb-1 text-white/80">CARD HOLDER</div>
              <div className="text-sm sm:text-base tracking-[2px] sm:tracking-[3px] uppercase">{fullUser?.nameRomaji || user.name}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] sm:text-[12px] tracking-[2px] mb-1 text-white/80">MEMBER SINCE</div>
              <div className="font-mono text-[14px] sm:text-xs tracking-wider text-white/80">
                {membership ? new Date(membership.contractDate).toLocaleDateString("en-US", { year: "numeric", month: "2-digit" }) : "--/----"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. ステータス（縦タイムライン 10ステップ） ── */}
      <h3 className="font-serif-jp text-base sm:text-lg font-normal text-text-primary tracking-wider mb-4 mt-2 pb-3 border-b border-border">
        ステータス
      </h3>

      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
        <div className="relative ml-1">
          {/* 縦の接続線 */}
          <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-border" />
          {/* ゴールドライン: 完了分は固定 + 次ステップへ光が流れ落ちるループ */}
          {(() => {
            let activeIndex = -1;
            for (let i = 0; i < TIMELINE_STEPS.length; i++) {
              if (!isStepDone(TIMELINE_STEPS[i].key)) { activeIndex = i; break; }
            }
            const allDone = activeIndex === -1;
            if (allDone) activeIndex = TIMELINE_STEPS.length - 1;

            // 現在のアクティブステップのノード中心まで固定ライン
            const donePct = ((activeIndex + 0.3) / TIMELINE_STEPS.length) * 100;
            // 次のステップのノード中心まで
            const nextIndex = Math.min(activeIndex + 1, TIMELINE_STEPS.length - 1);
            const activePct = ((nextIndex + 0.3) / TIMELINE_STEPS.length) * 100;
            const segmentHeight = activePct - donePct;

            return (
              <>
                {/* 完了〜現在ステップまでの固定ゴールドライン */}
                <div
                  className="absolute left-[15px] top-0 w-[2px] z-[1]"
                  style={{ height: `${donePct}%`, background: "var(--color-gold-primary)" }}
                />
                {/* 次ステップへ流れ落ちる光（スクロールインジケーター風） */}
                {!allDone && segmentHeight > 0 && (
                  <div
                    className="absolute left-[15px] w-[2px] z-[1] overflow-hidden"
                    style={{ top: `${donePct}%`, height: `${segmentHeight}%` }}
                  >
                    <div
                      className="w-full"
                      style={{
                        height: "80%",
                        background: "linear-gradient(to bottom, transparent, var(--color-gold-primary) 30%, var(--color-gold-primary) 70%, transparent)",
                        animation: "scroll-drop 3.5s cubic-bezier(0.15, 0.2, 0.1, 1) infinite",
                      }}
                    />
                  </div>
                )}
                <style>{`
                  @keyframes scroll-drop {
                    0% { transform: translateY(-100%); opacity: 0; }
                    10% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translateY(450%); opacity: 0; }
                  }
                `}</style>
              </>
            );
          })()}

          {TIMELINE_STEPS.map((step, i) => {
            const done = isStepDone(step.key);
            const active = isStepActive(step.key, i);
            const dateStr = formatDate(getStepDate(step.key));
            const isStorage = step.key === "STORAGE_ACTIVE";
            const isFirstAdaptCheck = step.key === "TERMS_AGREED";

            return (
              <div key={step.key} className="flex items-start gap-4 pb-6 last:pb-0 relative">
                {/* ノード */}
                <div
                  className={`relative z-[2] w-[32px] h-[32px] rounded-full flex items-center justify-center shrink-0 text-sm transition-all duration-500 ${
                    done
                      ? "text-bg-primary font-bold"
                      : active
                      ? "border-2 border-gold text-gold"
                      : "border border-border text-text-muted"
                  } ${active ? "animate-pulse-gold" : ""}`}
                  style={{
                    background: done
                      ? "linear-gradient(135deg, var(--color-gold-primary), var(--color-gold-light))"
                      : active
                      ? "var(--color-bg-primary)"
                      : "var(--color-bg-elevated)",
                  }}
                >
                  {done ? "✓" : step.icon}
                </div>

                {/* コンテンツ */}
                <div className="pt-1 min-w-0 flex-1">
                  <div className={`text-[13px] sm:text-sm ${done ? "text-gold" : active ? "text-gold-light font-semibold" : "text-text-muted"}`}>
                    {step.label}
                  </div>
                  {/* 日付 */}
                  {dateStr && (
                    <div className="text-[10px] text-text-muted font-mono mt-0.5">
                      {dateStr}
                    </div>
                  )}
                  {/* 適合確認のサブテキスト */}
                  {isFirstAdaptCheck && done && (
                    <div className="text-[11px] text-status-active mt-0.5">適合の可能性が極めて高い</div>
                  )}
                  {/* 保管中の補足 */}
                  {isStorage && done && storageEndDate && (
                    <div className="text-[11px] text-gold mt-0.5">
                      {membership?.storageYears}年間保管（〜{formatDate(storageEndDate.toISOString())}）
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 契約・同意事項書類一覧 ── */}
      <div className="mt-4">
        <Link
          href="/documents"
          className="flex items-center gap-4 bg-bg-secondary border border-border rounded-md p-4 hover:border-border-gold transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center text-lg shrink-0">◇</div>
          <div className="flex-1">
            <div className="text-sm text-text-primary group-hover:text-gold transition-colors font-medium">契約・同意事項書類一覧</div>
            <div className="text-[11px] text-text-muted mt-0.5">
              {documents.filter((d) => d.status === "SIGNED").length} / {documents.length} 署名済み
            </div>
          </div>
          <span className="text-text-muted group-hover:text-gold transition-colors">→</span>
        </Link>
      </div>

      {/* ── 次のステップ ── */}
      {membership && (
        <div className="mt-8">
          <h3 className="font-serif-jp text-base sm:text-lg font-normal text-text-primary tracking-wider mb-4 pb-3 border-b border-border">
            次のステップ
          </h3>

          {membership.ipsStatus === "REGISTERED" && (
            <Link href="/important-notice" className="block group">
              <div className="relative overflow-hidden rounded-xl border border-border-gold" style={{ background: "linear-gradient(135deg, rgba(191,160,75,0.08) 0%, rgba(191,160,75,0.02) 100%)" }}>
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📋</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/20">NEXT</span>
                  </div>
                  <div className="text-base sm:text-lg text-text-primary font-medium mb-2">iPS細胞作製適合確認</div>
                  <div className="text-xs text-text-muted leading-relaxed mb-4">健康状態をご確認いただき、適合審査にお進みください。</div>
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold tracking-wider group-hover:scale-[1.02] transition-all" style={{ background: "linear-gradient(135deg, #BFA04B, #D4B856)", color: "#070709" }}>
                    確認へ進む <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {membership.ipsStatus === "TERMS_AGREED" && (
            <Link href="/apply-service" className="block group">
              <div className="relative overflow-hidden rounded-xl border border-border-gold" style={{ background: "linear-gradient(135deg, rgba(191,160,75,0.08) 0%, rgba(191,160,75,0.02) 100%)" }}>
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">✍️</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/20">NEXT</span>
                  </div>
                  <div className="text-base sm:text-lg text-text-primary font-medium mb-2">サービス申込</div>
                  <div className="text-xs text-text-muted leading-relaxed mb-4">健康状態を確認させていただき、iPS細胞作製適合の可能性が極めて高いと判断いたしました。iPS細胞サービスへのお申込みに進めます。</div>
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold tracking-wider group-hover:scale-[1.02] transition-all" style={{ background: "linear-gradient(135deg, #BFA04B, #D4B856)", color: "#070709" }}>
                    申込へ進む <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {membership.ipsStatus === "SERVICE_APPLIED" && membership.paymentStatus !== "COMPLETED" && (
            <div className="rounded-xl border border-border-gold overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(191,160,75,0.08) 0%, rgba(191,160,75,0.02) 100%)" }}>
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">💰</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/20">NEXT</span>
                </div>
                <div className="text-base sm:text-lg text-text-primary font-medium mb-2">入金確認</div>
                <div className="text-xs text-text-muted leading-relaxed">
                  お申込みありがとうございます。入金の確認が取れ次第、次のステップへ進みます。
                </div>
                <div className="mt-4 bg-bg-elevated border border-border rounded-md p-4">
                  <div className="text-[11px] text-text-muted mb-1">お支払い金額</div>
                  <div className="font-mono text-lg text-gold">¥{membership.totalAmount.toLocaleString()}</div>
                  <div className="text-[11px] text-text-muted mt-2">
                    入金済: ¥{membership.paidAmount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {membership.ipsStatus === "SERVICE_APPLIED" && membership.paymentStatus === "COMPLETED" && (
            <div className="rounded-xl border border-border-gold overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(191,160,75,0.08) 0%, rgba(191,160,75,0.02) 100%)" }}>
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">📅</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/20">NEXT</span>
                </div>
                <div className="text-base sm:text-lg text-text-primary font-medium mb-2">日程調整</div>
                <div className="text-xs text-text-muted leading-relaxed mb-2">入金確認が完了しました。問診・採血の日程を調整いたします。</div>
                <ScheduleRequestButton />
              </div>
            </div>
          )}

          {membership.ipsStatus === "SCHEDULE_ARRANGED" && (
            <div className="space-y-4">
              {/* インフォームドコンセント未同意の場合 */}
              {!isStepDone("DOC_INFORMED") && (
                <Link href="/mypage/informed-consent" className="block group">
                  <div className="relative overflow-hidden rounded-xl border border-status-warning/30" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(251,191,36,0.02) 100%)" }}>
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">📄</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-warning/15 text-status-warning border border-status-warning/20">要同意</span>
                      </div>
                      <div className="text-base sm:text-lg text-text-primary font-medium mb-2">インフォームドコンセント</div>
                      <div className="text-xs text-status-warning leading-relaxed mb-1">※ こちらの同意がないと、問診・採血に進めません</div>
                      <div className="text-xs text-text-muted leading-relaxed mb-4">自家iPS細胞作製に関する説明書をご確認ください。</div>
                      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold tracking-wider group-hover:scale-[1.02] transition-all" style={{ background: "linear-gradient(135deg, #BFA04B, #D4B856)", color: "#070709" }}>
                        同意書を確認する <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              )}

              {/* 日程情報 */}
              <div className="rounded-xl border border-border-gold overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(191,160,75,0.08) 0%, rgba(191,160,75,0.02) 100%)" }}>
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">📅</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/20">予定</span>
                  </div>
                  <div className="text-base sm:text-lg text-text-primary font-medium mb-3">問診・採血の予定</div>
                  {membership.clinicDate ? (
                    <div className="bg-bg-elevated border border-border rounded-md p-4">
                      <div className="text-[11px] text-text-muted mb-1">問診・採血予定日</div>
                      <div className="font-mono text-lg text-gold">
                        {new Date(membership.clinicDate).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-text-secondary">日程を調整中です。確定次第こちらに表示されます。</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {(membership.ipsStatus === "BLOOD_COLLECTED" || membership.ipsStatus === "IPS_CREATING") && (
            <div className="rounded-xl border border-border-gold overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(191,160,75,0.08) 0%, rgba(191,160,75,0.02) 100%)" }}>
              <div className="p-5 sm:p-6 text-center">
                <div className="text-4xl mb-3">🧬</div>
                <div className="text-base sm:text-lg text-gold font-medium mb-2">iPS細胞を作製中</div>
                <div className="text-xs text-text-muted leading-relaxed">お客様のiPS細胞を丁寧に作製しております。<br />今しばらくお待ちください。</div>
              </div>
            </div>
          )}

          {membership.ipsStatus === "STORAGE_ACTIVE" && (
            <div className="rounded-xl border border-border-gold overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(191,160,75,0.08) 0%, rgba(191,160,75,0.02) 100%)" }}>
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🏛️</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-active/15 text-status-active border border-status-active/20">保管中</span>
                </div>
                <div className="text-base sm:text-lg text-text-primary font-medium mb-3">iPS細胞 安全に保管中</div>
                <div className="bg-bg-elevated border border-border rounded-md p-4">
                  <div className="text-[11px] text-text-muted mb-1">保管期限</div>
                  <div className="font-mono text-lg text-gold">
                    {storageEndDate ? formatDate(storageEndDate.toISOString()) : "---"}
                  </div>
                  {membership.storageStartAt && (
                    <div className="text-[11px] text-text-muted mt-2">保管開始日: {formatDate(membership.storageStartAt.toISOString())}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 健康状態確認 ── */}
      {fullUser && (
        <div className="mt-8">
          <h3 className="font-serif-jp text-base sm:text-lg font-normal text-text-primary tracking-wider mb-4 pb-3 border-b border-border">
            健康状態確認
          </h3>
          <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-6">
            <div className="space-y-3">
              <HealthItem label="現在治療中の病気" active={fullUser.currentIllness} detail={fullUser.currentIllnessDetail} />
              <HealthItem label="過去の病気・手術歴" active={fullUser.pastIllness} detail={fullUser.pastIllnessDetail} />
              <HealthItem label="現在使用中の薬" active={fullUser.currentMedication} detail={fullUser.currentMedicationDetail} />
              <HealthItem label="持病" active={fullUser.chronicDisease} detail={fullUser.chronicDiseaseDetail} />
              <HealthItem label="感染症の罹患歴" active={fullUser.infectiousDisease} detail={fullUser.infectiousDiseaseDetail} />
              <HealthItem label="妊娠中・妊娠の可能性" active={fullUser.pregnancy} />
              <HealthItem label="アレルギー" active={fullUser.allergy} detail={fullUser.allergyDetail} />
              <HealthItem label="その他の健康上の事項" active={fullUser.otherHealth} detail={fullUser.otherHealthDetail} />
            </div>
            {!fullUser.currentIllness && !fullUser.pastIllness && !fullUser.currentMedication &&
             !fullUser.chronicDisease && !fullUser.infectiousDisease && !fullUser.pregnancy &&
             !fullUser.allergy && !fullUser.otherHealth && (
              <div className="text-center text-sm text-text-muted py-4">特記事項なし</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HealthItem({ label, active, detail }: { label: string; active: boolean; detail?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-b-0">
      <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
        active ? "bg-status-warning/20 text-status-warning border border-status-warning/30" : "bg-bg-elevated text-text-muted border border-border"
      }`}>
        {active ? "!" : "✓"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-text-primary">{label}</div>
        {active ? (
          <div className="text-[12px] text-text-secondary mt-0.5">{detail || "あり"}</div>
        ) : (
          <div className="text-[12px] text-text-muted mt-0.5">なし</div>
        )}
      </div>
    </div>
  );
}
