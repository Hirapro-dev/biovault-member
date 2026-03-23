import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import StatusTimeline from "@/components/ui/StatusTimeline";
import GoldDivider from "@/components/ui/GoldDivider";

export default async function DashboardPage() {
  const user = await requireAuth();

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
      {/* ウェルカムカード */}
      <div
        className="border border-border-gold rounded-md p-8 mb-8"
        style={{
          background: "linear-gradient(135deg, var(--color-bg-secondary) 0%, rgba(201,168,76,0.05) 100%)",
        }}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[11px] text-gold-dark tracking-[3px] mb-2">WELCOME</div>
            <h2 className="font-serif-jp text-[28px] font-normal m-0 text-text-primary">
              {user.name}{" "}
              <span className="text-base text-text-secondary font-light">様</span>
            </h2>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-text-muted tracking-wider">会員番号</div>
            <div className="font-mono text-lg text-gold tracking-[2px] mt-0.5">
              {membership?.memberNumber || "---"}
            </div>
            <div className="text-[11px] text-text-muted mt-2">
              ご契約日: {membership ? new Date(membership.contractDate).toLocaleDateString("ja-JP") : "---"}
            </div>
          </div>
        </div>
      </div>

      {/* iPS 細胞ステータス */}
      <h3 className="font-serif-jp text-base font-normal text-text-primary tracking-wider mb-4 mt-2 pb-3 border-b border-border">
        iPS 細胞ステータス
      </h3>
      {membership ? (
        <StatusTimeline currentStatus={membership.ipsStatus} />
      ) : (
        <div className="bg-bg-secondary border border-border rounded-md p-8 text-center text-text-muted text-sm">
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
      <div className="grid grid-cols-2 gap-5 mt-9">
        <QuickCard
          title="契約書類"
          count={`${signedCount} / ${documents.length}`}
          sub="署名済み"
          icon="◇"
        />
        <QuickCard
          title="醸成器投与"
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
    <div className="mt-6 bg-bg-secondary border border-border-gold rounded-md p-8">
      <h4 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4">
        保管期間
      </h4>
      <div className="flex items-center gap-8">
        {/* 円形プログレス */}
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--color-gold-primary)"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress)}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-sm text-gold">
              {Math.round(progress * 100)}%
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <div className="font-mono text-2xl text-gold font-light">
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

function QuickCard({
  title,
  count,
  sub,
  icon,
}: {
  title: string;
  count: string;
  sub: string;
  icon: string;
}) {
  return (
    <div className="bg-bg-secondary border border-border rounded-md p-6 flex items-center gap-5 transition-colors duration-300 hover:border-border-gold cursor-pointer">
      <div className="w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center text-xl text-gold">
        {icon}
      </div>
      <div>
        <div className="text-xs text-text-muted mb-1">{title}</div>
        <div className="font-mono text-[28px] text-gold font-light">{count}</div>
        <div className="text-[11px] text-text-secondary">{sub}</div>
      </div>
    </div>
  );
}
