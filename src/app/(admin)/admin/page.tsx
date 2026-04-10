import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import { IPS_STATUS_LABELS, IPS_STATUS_ORDER, IPS_STATUS_ICONS } from "@/types";
import PendingActionsTabs from "@/components/admin/PendingActionsTabs";
import PendingActionRow from "@/components/admin/PendingActionRow";
import { getPendingActions } from "@/lib/pending-actions";

export default async function AdminDashboardPage() {
  await requireAdmin();

  // 各ステータスの件数を集計
  const statusCounts = await prisma.membership.groupBy({
    by: ["ipsStatus"],
    _count: true,
  });

  const countMap: Record<string, number> = {};
  for (const item of statusCounts) {
    countMap[item.ipsStatus] = item._count;
  }

  const [totalMembers, paymentCompleted, recentLogs] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.membership.count({ where: { paymentStatus: "COMPLETED" } }),
    prisma.statusHistory.findMany({
      take: 10,
      orderBy: { changedAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
  ]);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const newThisMonth = await prisma.user.count({
    where: { role: "MEMBER", createdAt: { gte: startOfMonth } },
  });

  // ── 対応が必要な会員を共通ヘルパーで取得 ──
  // 管理者は全会員が対象なのでスコープ条件なし
  const { ipsActionItems, cfActionItems, totalPendingCount } = await getPendingActions();

  // サマリー統計（従来の4カード）
  const serviceApplied = (countMap["SERVICE_APPLIED"] || 0) +
    (countMap["SCHEDULE_ARRANGED"] || 0) + (countMap["BLOOD_COLLECTED"] || 0) +
    (countMap["IPS_CREATING"] || 0) + (countMap["STORAGE_ACTIVE"] || 0);

  const stats = [
    { label: "総会員数", value: String(totalMembers), sub: "名" },
    { label: "成約数", value: String(serviceApplied), sub: "名" },
    { label: "入金完了", value: String(paymentCompleted), sub: "名" },
    { label: "今月新規", value: String(newThisMonth), sub: "名" },
  ];

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        管理ダッシュボード
      </h2>

      {/* 統計カード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6 text-center"
          >
            <div className="text-[11px] text-text-muted tracking-[2px] mb-2">{s.label}</div>
            <div className="font-mono text-4xl text-gold font-light">{s.value}</div>
            <div className="text-[11px] text-text-secondary">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* 対応が必要な会員（iPS作製・保管／iPS培養上清液 タブ切替） */}
      {totalPendingCount > 0 && (
        <div className="mb-6 sm:mb-8">
          <h3 className="font-serif-jp text-base font-normal text-text-primary tracking-wider mb-4 pb-3 border-b border-border">
            対応が必要な会員 <span className="text-gold font-mono ml-2">{totalPendingCount}</span>
          </h3>
          <PendingActionsTabs
            ipsCount={ipsActionItems.length}
            cfCount={cfActionItems.length}
            ipsList={
              <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
                {ipsActionItems.map((item, i) => (
                  <PendingActionRow
                    key={`${item.userId}-${i}`}
                    href={`/admin/members/${item.userId}`}
                    memberNumber={item.memberNumber}
                    name={item.name}
                    action={item.action}
                    icon={item.icon}
                    actionColor={item.color}
                    since={item.since}
                  />
                ))}
              </div>
            }
            cfList={
              <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
                {cfActionItems.map((item, i) => (
                  <PendingActionRow
                    key={`${item.orderId}-${i}`}
                    href={`/admin/members/${item.userId}`}
                    memberNumber={item.memberNumber}
                    name={item.name}
                    action={item.action}
                    icon={item.icon}
                    actionColor={item.color}
                    since={item.since}
                  />
                ))}
              </div>
            }
          />
        </div>
      )}

      {/* ファネル表示 */}
      <h3 className="font-serif-jp text-base font-normal text-text-primary tracking-wider mb-4 pb-3 border-b border-border">
        ステータス別会員数
      </h3>
      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="space-y-2">
          {IPS_STATUS_ORDER.map((status, i) => {
            const count = countMap[status] || 0;
            const widthPercent = totalMembers > 0 ? (count / totalMembers) * 100 : 0;
            // 成約ライン（SERVICE_APPLIED）の前に区切り
            const isServiceLine = status === "SERVICE_APPLIED";

            return (
              <div key={status}>
                {isServiceLine && (
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex-1 h-[1px] bg-gold/30" />
                    <span className="text-[10px] text-gold tracking-wider">成約ライン</span>
                    <div className="flex-1 h-[1px] bg-gold/30" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-5 text-center text-sm">
                    {IPS_STATUS_ICONS[status]}
                  </div>
                  <div className="w-24 sm:w-32 text-xs text-text-secondary truncate">
                    {IPS_STATUS_LABELS[status]}
                  </div>
                  <div className="flex-1 h-6 bg-bg-tertiary rounded overflow-hidden">
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{
                        width: `${Math.max(widthPercent, count > 0 ? 4 : 0)}%`,
                        background: i < 2
                          ? "linear-gradient(90deg, var(--color-gold-dark), var(--color-gold-primary))"
                          : "linear-gradient(90deg, var(--color-gold-primary), var(--color-gold-light))",
                      }}
                    />
                  </div>
                  <div className="w-10 text-right font-mono text-sm text-gold">
                    {count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 最近のステータス変更 */}
      <h3 className="font-serif-jp text-base font-normal text-text-primary tracking-wider mb-4 pb-3 border-b border-border">
        最近のステータス変更
      </h3>
      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {recentLogs.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">
            ステータス変更履歴はありません
          </div>
        ) : (
          recentLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-b-0"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
              <div className="flex-1">
                <span className="text-[13px] text-text-primary">{log.user.name}</span>
                <span className="text-xs text-text-muted mx-2">—</span>
                <span className="text-xs text-text-secondary">
                  {IPS_STATUS_LABELS[log.fromStatus]}
                </span>
                <span className="text-xs text-gold mx-1.5">→</span>
                <span className="text-xs text-gold">{IPS_STATUS_LABELS[log.toStatus]}</span>
              </div>
              <div className="text-[11px] text-text-muted font-mono">
                {new Date(log.changedAt).toLocaleDateString("ja-JP")}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
