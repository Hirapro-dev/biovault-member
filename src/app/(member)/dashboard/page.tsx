import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import StatusTimeline from "@/components/ui/StatusTimeline";
import { POST_SERVICE_STATUSES } from "@/types";
import type { IpsStatus } from "@/types";

export default async function DashboardPage() {
  const user = await requireAuth();

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { nameRomaji: true },
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
          {/* 背景画像（透過） */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "url('/card_bg.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {/* シルバー光沢オーバーレイ */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(160deg, transparent 5%, rgba(255,255,255,0.04) 15%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.04) 95%, transparent 95%)",
            }}
          />

          {/* 上部: ロゴ + MEMBER */}
          <div className="relative z-10 flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo_white.png"
              alt="BioVault"
              className="h-5 sm:h-6 w-auto opacity-70"
            />
            <div className="text-[9px] sm:text-[10px] tracking-[3px] font-light text-white/80">
              MEMBER
            </div>
          </div>

          {/* 中央: 会員ID */}
          <div className="relative z-10">
            <div className="font-mono text-xl sm:text-2xl tracking-[6px] sm:tracking-[8px]">
              {membership?.memberNumber || "----"}
            </div>
          </div>

          {/* 下部: ローマ字氏名 + 契約年月 */}
          <div className="relative z-10 flex items-end justify-between">
            <div>
              <div className="text-[10px] sm:text-[12px] tracking-[2px] mb-1 text-white/80">
                CARD HOLDER
              </div>
              <div className="text-sm sm:text-base tracking-[2px] sm:tracking-[3px] uppercase">
                {fullUser?.nameRomaji || user.name}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] sm:text-[12px] tracking-[2px] mb-1 text-white/80">
                MEMBER SINCE
              </div>
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
        <StatusTimeline currentStatus={membership.ipsStatus} />
      ) : (
        <div className="bg-bg-secondary border border-border rounded-md p-6 sm:p-8 text-center text-text-muted text-sm">
          会員権情報が見つかりません
        </div>
      )}

      {/* 次のアクション CTA */}
      {membership && (
        <NextActionCTA ipsStatus={membership.ipsStatus} />
      )}

      {/* 保管中の場合: 保管期間表示 */}
      {membership?.ipsStatus === "STORAGE_ACTIVE" && membership.storageStartAt && (
        <StoragePeriodCard
          storageStartAt={membership.storageStartAt}
          storageYears={membership.storageYears}
        />
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

      {/* 購入前の場合: About iPS への導線 */}
      {!isPurchased && (
        <div className="mt-6 sm:mt-9">
          <Link
            href="/about-ips"
            className="block bg-bg-secondary border border-border rounded-md p-5 sm:p-6 hover:border-border-gold transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center text-xl shrink-0">
                🧬
              </div>
              <div className="flex-1">
                <div className="text-sm text-text-primary group-hover:text-gold transition-colors">
                  iPS細胞について知る
                </div>
                <div className="text-xs text-text-muted mt-1">
                  iPS細胞の可能性、研究動向、最新ニュースをご覧いただけます
                </div>
              </div>
              <div className="text-text-muted group-hover:text-gold transition-colors">→</div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

// 次のアクション CTA コンポーネント
function NextActionCTA({ ipsStatus }: { ipsStatus: IpsStatus }) {
  const ctaConfig: Record<string, { text: string; sub: string; href?: string }> = {
    REGISTERED: {
      text: "重要事項を確認する",
      sub: "次のステップに進むために、重要事項説明をご確認ください",
      href: "/important-notice",
    },
    TERMS_AGREED: {
      text: "iPSサービスに申し込む",
      sub: "iPSサービスへのお申込みに進めます",
      href: "/apply-service",
    },
    SERVICE_APPLIED: {
      text: "担当者からのご連絡をお待ちください",
      sub: "お申込み内容を確認のうえ、担当者より改めてご連絡いたします",
    },
    SCHEDULE_ARRANGED: {
      text: "ステータス詳細を確認",
      sub: "クリニックでの採血日程をご確認いただけます",
      href: "/status",
    },
    BLOOD_COLLECTED: {
      text: "iPS細胞作製の進捗を確認",
      sub: "現在のiPS細胞作製状況をご確認いただけます",
      href: "/status",
    },
    IPS_CREATING: {
      text: "iPS細胞作製の進捗を確認",
      sub: "現在のiPS細胞作製状況をご確認いただけます",
      href: "/status",
    },
    STORAGE_ACTIVE: {
      text: "保管状況を確認",
      sub: "iPS細胞の保管状況をご確認いただけます",
      href: "/status",
    },
  };

  const config = ctaConfig[ipsStatus];
  if (!config) return null;

  // 購入前ステップ（REGISTERED, TERMS_AGREED）は大きめのCTA
  const isPreService = ["REGISTERED", "TERMS_AGREED"].includes(ipsStatus);
  // 営業フォロー待ち（SERVICE_APPLIED）はテキストのみ
  const isWaiting = ipsStatus === "SERVICE_APPLIED";

  if (isWaiting) {
    return (
      <div className="mt-5 bg-bg-secondary border border-border-gold rounded-md p-5 sm:p-6 text-center">
        <div className="text-gold text-sm font-medium mb-1">{config.text}</div>
        <div className="text-xs text-text-muted">{config.sub}</div>
      </div>
    );
  }

  if (isPreService && config.href) {
    return (
      <Link href={config.href}>
        <div className="mt-5 bg-gold-gradient rounded-md p-5 sm:p-6 text-center cursor-pointer hover:opacity-90 transition-opacity">
          <div className="text-bg-primary text-sm font-semibold tracking-wider mb-1">
            {config.text}
          </div>
          <div className="text-bg-primary/70 text-xs">{config.sub}</div>
        </div>
      </Link>
    );
  }

  if (config.href) {
    return (
      <Link href={config.href}>
        <div className="mt-5 bg-bg-secondary border border-border rounded-md p-4 sm:p-5 flex items-center justify-between hover:border-border-gold transition-all cursor-pointer">
          <div>
            <div className="text-sm text-text-primary">{config.text}</div>
            <div className="text-xs text-text-muted mt-0.5">{config.sub}</div>
          </div>
          <div className="text-gold">→</div>
        </div>
      </Link>
    );
  }

  return null;
}

function StoragePeriodCard({
  storageStartAt,
  storageYears,
}: {
  storageStartAt: Date;
  storageYears: number;
}) {
  const start = new Date(storageStartAt);
  const end = new Date(start);
  end.setFullYear(end.getFullYear() + storageYears);

  const now = new Date();
  const totalMs = end.getTime() - start.getTime();
  const elapsedMs = now.getTime() - start.getTime();
  const remainMs = end.getTime() - now.getTime();
  const progress = Math.min(Math.max(elapsedMs / totalMs, 0), 1);

  const remainYears = Math.floor(remainMs / (365.25 * 24 * 60 * 60 * 1000));
  const remainMonths = Math.floor(
    (remainMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="mt-5 sm:mt-6 bg-bg-secondary border border-border-gold rounded-md p-5 sm:p-8">
      <h4 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4">
        保管期間
      </h4>
      <div className="flex items-center gap-5 sm:gap-8">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-border)" strokeWidth="4" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-gold-primary)" strokeWidth="4" strokeDasharray={`${2 * Math.PI * 42}`} strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress)}`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-xs sm:text-sm text-gold">{Math.round(progress * 100)}%</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="font-mono text-lg sm:text-2xl text-gold font-light">
            残り {remainYears}年 {remainMonths}ヶ月
          </div>
          <div className="text-[11px] text-text-muted space-y-1">
            <div>保管開始: {start.toLocaleDateString("ja-JP")}</div>
            <div>保管満了: {end.toLocaleDateString("ja-JP")}</div>
          </div>
        </div>
      </div>
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
