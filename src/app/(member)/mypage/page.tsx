import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import StatusTimeline from "@/components/ui/StatusTimeline";
import ScheduleRequestButton from "./ScheduleRequestButton";
import { POST_SERVICE_STATUSES } from "@/types";

export default async function MyPage() {
  const user = await requireAuth();

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      nameRomaji: true,
      // 健康状態
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
  });

  const membership = await prisma.membership.findUnique({
    where: { userId: user.id },
    include: {
      treatments: true,
    },
  });

  const documents = await prisma.document.findMany({
    where: { userId: user.id },
  });

  const signedCount = documents.filter((d) => d.status === "SIGNED").length;

  // 購入済みかどうか（SERVICE_APPLIED以降）
  const isPurchased = membership && POST_SERVICE_STATUSES.includes(membership.ipsStatus);

  // ステータス履歴から各ステータスの到達日を取得
  const statusHistories = await prisma.statusHistory.findMany({
    where: { userId: user.id },
    orderBy: { changedAt: "asc" },
    select: { toStatus: true, changedAt: true },
  });

  // 各ステータスへの最初の到達日をマッピング
  const statusDates: Partial<Record<string, string>> = {};
  // メンバー登録日 = 契約日
  if (membership) {
    statusDates["REGISTERED"] = membership.contractDate.toISOString();
  }
  for (const h of statusHistories) {
    if (!statusDates[h.toStatus]) {
      statusDates[h.toStatus] = h.changedAt.toISOString();
    }
  }

  // 保管満了日の計算
  const storageEndDate = membership?.storageStartAt
    ? (() => {
        const end = new Date(membership.storageStartAt);
        end.setFullYear(end.getFullYear() + membership.storageYears);
        return end;
      })()
    : null;

  return (
    <div>
      {/* メンバーカード */}
      <div className="mb-6 sm:mb-8" style={{ minWidth: 280, maxWidth: 540 }}>
        <div
          className="relative overflow-hidden rounded-2xl p-6 sm:p-8 w-full aspect-[1.586/1] flex flex-col justify-between border border-white/15"
          style={{
            background: "#0A0A0C",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "url('/card_bg.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(160deg, transparent 5%, rgba(255,255,255,0.04) 15%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 95%, transparent 95%)",
            }}
          />

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
                {membership
                  ? new Date(membership.contractDate).toLocaleDateString("en-US", { year: "numeric", month: "2-digit" })
                  : "--/----"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ステップ進捗 */}
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

      {/* ══════════════════════════════════════════ */}
      {/* ── 次のステップ案内（ステータス別） ── */}
      {/* ══════════════════════════════════════════ */}
      {membership && (
        <>
          {/* ① メンバー登録 → 適合確認（健康状態確認）へ */}
          {membership.ipsStatus === "REGISTERED" && (
            <Link href="/important-notice" className="block mt-5 group">
              <div
                className="relative overflow-hidden rounded-lg p-5 sm:p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(201,168,76,0.3)] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #BFA04B 0%, #D4B856 50%, #BFA04B 100%)",
                  boxShadow: "0 4px 15px rgba(201,168,76,0.25)",
                }}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="text-bg-primary text-sm sm:text-base font-bold tracking-wider mb-1">
                      iPS細胞作製適合確認へ進む
                    </div>
                    <div className="text-bg-primary/60 text-xs">
                      健康状態をご確認いただき、適合審査にお進みください
                    </div>
                  </div>
                  <div className="shrink-0 w-10 h-10 rounded-full bg-bg-primary/20 flex items-center justify-center ml-4 group-hover:translate-x-1 transition-transform duration-300">
                    <span className="text-bg-primary text-lg">→</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* ② 適合確認済み → サービス申込 */}
          {membership.ipsStatus === "TERMS_AGREED" && (
            <Link href="/apply-service" className="block mt-5 group">
              <div
                className="relative overflow-hidden rounded-lg p-5 sm:p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(201,168,76,0.3)] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #BFA04B 0%, #D4B856 50%, #BFA04B 100%)",
                  boxShadow: "0 4px 15px rgba(201,168,76,0.25)",
                }}
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <div className="text-bg-primary text-sm sm:text-base font-bold tracking-wider mb-1">
                      サービス申込へ進む
                    </div>
                    <div className="text-bg-primary/60 text-xs">
                      iPSサービスへのお申込みに進めます
                    </div>
                  </div>
                  <div className="shrink-0 w-10 h-10 rounded-full bg-bg-primary/20 flex items-center justify-center ml-4 group-hover:translate-x-1 transition-transform duration-300">
                    <span className="text-bg-primary text-lg">→</span>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* ③ サービス申込済み → 日程調整ボタン */}
          {membership.ipsStatus === "SERVICE_APPLIED" && (
            <ScheduleRequestButton />
          )}

          {/* ④ 日程調整中 → 問診・採血予定日を表示 */}
          {membership.ipsStatus === "SCHEDULE_ARRANGED" && (
            <div className="mt-5 bg-bg-secondary border border-border-gold rounded-md p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">📅</span>
                <div className="text-gold text-sm font-medium">問診・採血の予定</div>
              </div>
              {membership.clinicDate ? (
                <div className="bg-bg-elevated border border-border rounded-md p-4">
                  <div className="text-[11px] text-text-muted mb-1">問診・採血予定日</div>
                  <div className="font-mono text-lg text-gold">
                    {new Date(membership.clinicDate).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-text-secondary leading-relaxed">
                  日程を調整中です。確定次第こちらに表示されます。<br />
                  <span className="text-xs text-text-muted">担当者からのご連絡をお待ちください。</span>
                </div>
              )}
            </div>
          )}

          {/* ⑤ 問診・採血済み → iPS細胞作製中 */}
          {membership.ipsStatus === "BLOOD_COLLECTED" && (
            <div className="mt-5 bg-bg-secondary border border-border-gold rounded-md p-5 sm:p-6 text-center">
              <div className="text-2xl mb-2">🧬</div>
              <div className="text-gold text-sm font-medium mb-1">
                iPS細胞作製中
              </div>
              <div className="text-xs text-text-muted leading-relaxed">
                採血いただいた検体をもとに、iPS細胞の作製を開始しました。<br />
                完了まで今しばらくお待ちください。
              </div>
            </div>
          )}

          {/* ⑥ iPS細胞作製中 */}
          {membership.ipsStatus === "IPS_CREATING" && (
            <div className="mt-5 bg-bg-secondary border border-border-gold rounded-md p-5 sm:p-6 text-center">
              <div className="text-2xl mb-2">🧬</div>
              <div className="text-gold text-sm font-medium mb-1">
                現在iPS細胞を作製中です
              </div>
              <div className="text-xs text-text-muted leading-relaxed">
                お客様のiPS細胞を丁寧に作製しております。<br />
                今しばらくお待ちください。
              </div>
            </div>
          )}

          {/* ⑦ iPS細胞保管中 → 保管期限表示 */}
          {membership.ipsStatus === "STORAGE_ACTIVE" && (
            <div className="mt-5 bg-bg-secondary border border-border-gold rounded-md p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">🏛️</span>
                <div className="text-gold text-sm font-medium">iPS細胞 保管中</div>
              </div>
              <div className="bg-bg-elevated border border-border rounded-md p-4">
                <div className="text-[11px] text-text-muted mb-1">保管期限</div>
                <div className="font-mono text-lg text-gold">
                  {storageEndDate
                    ? storageEndDate.toLocaleDateString("ja-JP", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                    : "---"}
                </div>
                {membership.storageStartAt && (
                  <div className="text-[11px] text-text-muted mt-2">
                    保管開始日: {new Date(membership.storageStartAt).toLocaleDateString("ja-JP")}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* クイックカード（購入済みの場合のみ表示） */}
      {isPurchased && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mt-6 sm:mt-9">
          <QuickCard
            title="契約書類"
            count={`${signedCount} / ${documents.length}`}
            sub="署名済み"
            icon="◇"
          />
          <QuickCard
            title="培養上清液投与"
            count={String(membership?.treatments.length || 0)}
            sub="回投与済み"
            icon="◆"
          />
        </div>
      )}

      {/* 契約書類・同意書類 */}
      <div className="mt-6 sm:mt-9">
        <Link
          href="/documents"
          className="block bg-bg-secondary border border-border rounded-md p-5 sm:p-6 hover:border-border-gold transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center text-xl shrink-0">
              ◇
            </div>
            <div className="flex-1">
              <div className="text-sm text-text-primary group-hover:text-gold transition-colors">
                契約書類・同意書類
              </div>
              <div className="text-xs text-text-muted mt-1">
                契約書類の確認・署名状況
              </div>
            </div>
            <div className="text-text-muted group-hover:text-gold transition-colors">→</div>
          </div>
        </Link>
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* ── 健康状態セクション ── */}
      {/* ══════════════════════════════════════════ */}
      {fullUser && (
        <div className="mt-8 sm:mt-10">
          <h3 className="font-serif-jp text-base sm:text-lg font-normal text-text-primary tracking-wider mb-4 pb-3 border-b border-border">
            健康状態
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
            {/* 全項目「なし」の場合 */}
            {!fullUser.currentIllness && !fullUser.pastIllness && !fullUser.currentMedication &&
             !fullUser.chronicDisease && !fullUser.infectiousDisease && !fullUser.pregnancy &&
             !fullUser.allergy && !fullUser.otherHealth && (
              <div className="text-center text-sm text-text-muted py-4">
                特記事項なし
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickCard({ title, count, sub, icon }: { title: string; count: string; sub: string; icon: string }) {
  return (
    <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-6 flex items-center gap-4 sm:gap-5 transition-colors duration-300 hover:border-border-gold">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-bg-elevated flex items-center justify-center text-xl sm:text-2xl text-gold shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-xs sm:text-sm text-text-secondary mb-0.5">{title}</div>
        <div className="font-mono text-2xl sm:text-3xl text-gold font-light">{count}</div>
        <div className="text-xs text-text-secondary">{sub}</div>
      </div>
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
          <div className="text-[12px] text-text-secondary mt-0.5">
            {detail || "あり"}
          </div>
        ) : (
          <div className="text-[12px] text-text-muted mt-0.5">なし</div>
        )}
      </div>
    </div>
  );
}
