import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import StatusTimeline from "@/components/ui/StatusTimeline";
import ScheduleRequestButton from "./ScheduleRequestButton";

export default async function MyPage() {
  const user = await requireAuth();

  const [fullUser, membership, documents, statusHistories] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        nameRomaji: true,
        currentIllness: true,
        currentIllnessDetail: true,
        pastIllness: true,
        pastIllnessDetail: true,
        currentMedication: true,
        currentMedicationDetail: true,
        chronicDisease: true,
        chronicDiseaseDetail: true,
        infectiousDisease: true,
        infectiousDiseaseDetail: true,
        pregnancy: true,
        allergy: true,
        allergyDetail: true,
        otherHealth: true,
        otherHealthDetail: true,
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

  const signedCount = documents.filter((d) => d.status === "SIGNED").length;

  const statusDates: Partial<Record<string, string>> = {};
  if (membership) {
    statusDates["REGISTERED"] = membership.contractDate.toISOString();
  }
  for (const h of statusHistories) {
    if (!statusDates[h.toStatus]) {
      statusDates[h.toStatus] = h.changedAt.toISOString();
    }
  }

  const storageEndDate = membership?.storageStartAt
    ? (() => {
        const end = new Date(membership.storageStartAt);
        end.setFullYear(end.getFullYear() + membership.storageYears);
        return end;
      })()
    : null;

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
              <div className="text-sm sm:text-base tracking-[2px] sm:tracking-[3px] uppercase">
                {fullUser?.nameRomaji || user.name}
              </div>
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

      {/* ── 2. ステータス ── */}
      <h3 className="font-serif-jp text-base sm:text-lg font-normal text-text-primary tracking-wider mb-4 mt-2 pb-3 border-b border-border">
        ステータス
      </h3>
      {membership ? (
        <StatusTimeline currentStatus={membership.ipsStatus} statusDates={statusDates} />
      ) : (
        <div className="bg-bg-secondary border border-border rounded-md p-6 sm:p-8 text-center text-text-muted text-sm">
          会員権情報が見つかりません
        </div>
      )}

      {/* ── 修正1: ステータス直下に契約・同意事項書類一覧リンク ── */}
      <div className="mt-4">
        <Link
          href="/documents"
          className="flex items-center gap-4 bg-bg-secondary border border-border rounded-md p-4 hover:border-border-gold transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center text-lg shrink-0">◇</div>
          <div className="flex-1">
            <div className="text-sm text-text-primary group-hover:text-gold transition-colors font-medium">契約・同意事項書類一覧</div>
            <div className="text-[11px] text-text-muted mt-0.5">{signedCount} / {documents.length} 署名済み</div>
          </div>
          <span className="text-text-muted group-hover:text-gold transition-colors">→</span>
        </Link>
      </div>

      {/* ── 3. 次のステップ ── */}
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
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/20">STEP 1</span>
                  </div>
                  <div className="text-base sm:text-lg text-text-primary font-medium mb-2">iPS細胞作製適合確認</div>
                  <div className="text-xs text-text-muted leading-relaxed mb-4">健康状態をご確認いただき、iPS細胞作製の適合審査にお進みください。</div>
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
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/20">STEP 2</span>
                  </div>
                  <div className="text-base sm:text-lg text-text-primary font-medium mb-2">サービス申込</div>
                  <div className="text-xs text-text-muted leading-relaxed mb-4">適合確認が完了しました。iPSサービスへのお申込みに進めます。</div>
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold tracking-wider group-hover:scale-[1.02] transition-all" style={{ background: "linear-gradient(135deg, #BFA04B, #D4B856)", color: "#070709" }}>
                    申込へ進む <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {membership.ipsStatus === "SERVICE_APPLIED" && (
            <div className="rounded-xl border border-border-gold overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(191,160,75,0.08) 0%, rgba(191,160,75,0.02) 100%)" }}>
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">📅</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/20">STEP 3</span>
                </div>
                <div className="text-base sm:text-lg text-text-primary font-medium mb-2">日程調整</div>
                <div className="text-xs text-text-muted leading-relaxed mb-2">問診・採血の日程を調整いたします。</div>
                <ScheduleRequestButton />
              </div>
            </div>
          )}

          {membership.ipsStatus === "SCHEDULE_ARRANGED" && (
            <div className="rounded-xl border border-border-gold overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(191,160,75,0.08) 0%, rgba(191,160,75,0.02) 100%)" }}>
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">📅</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/20">STEP 4</span>
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
                    {storageEndDate ? storageEndDate.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }) : "---"}
                  </div>
                  {membership.storageStartAt && (
                    <div className="text-[11px] text-text-muted mt-2">保管開始日: {new Date(membership.storageStartAt).toLocaleDateString("ja-JP")}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 修正2: 健康状態確認（見出し + 一覧直接表示） ── */}
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
        active
          ? "bg-status-warning/20 text-status-warning border border-status-warning/30"
          : "bg-bg-elevated text-text-muted border border-border"
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
