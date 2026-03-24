import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import StatusTimeline from "@/components/ui/StatusTimeline";

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
          {/* シルバー光沢オーバーレイ（中心に向かうリニア） */}
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

      {/* iPS 細胞ステータス */}
      <h3 className="font-serif-jp text-base sm:text-lg font-normal text-text-primary tracking-wider mb-4 mt-2 pb-3 border-b border-border">
        iPS 細胞ステータス
      </h3>
      {membership ? (
        <StatusTimeline currentStatus={membership.ipsStatus} />
      ) : (
        <div className="bg-bg-secondary border border-border rounded-md p-6 sm:p-8 text-center text-text-muted text-sm">
          会員権情報が見つかりません
        </div>
      )}

      {/* 保管中の場合: 保管期間表示 */}
      {membership?.ipsStatus === "STORAGE_ACTIVE" && membership.storageStartAt && (
        <StoragePeriodCard
          storageStartAt={membership.storageStartAt}
          storageYears={membership.storageYears}
        />
      )}

      {/* クイックカード */}
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
    </div>
  );
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
