import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import { IPS_STATUS_LABELS } from "@/types";
import { getIpsTimeline, getCfTimeline } from "@/lib/dashboard-timeline";
import DashboardTimelineTabs from "@/components/dashboard/DashboardTimelineTabs";
import TimelineView from "@/components/dashboard/TimelineView";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [totalMembers, paymentCompleted, recentLogs, ipsTimeline, cfTimeline] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.membership.count({ where: { paymentStatus: "COMPLETED" } }),
    prisma.statusHistory.findMany({
      take: 10,
      orderBy: { changedAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
    getIpsTimeline(),
    getCfTimeline(),
  ]);

  // 成約数（SERVICE_APPLIED以降）
  const statusCounts = await prisma.membership.groupBy({ by: ["ipsStatus"], _count: true });
  const countMap: Record<string, number> = {};
  for (const item of statusCounts) countMap[item.ipsStatus] = item._count;
  const serviceApplied = (countMap["SERVICE_APPLIED"] || 0) + (countMap["SCHEDULE_ARRANGED"] || 0) +
    (countMap["BLOOD_COLLECTED"] || 0) + (countMap["IPS_CREATING"] || 0) + (countMap["STORAGE_ACTIVE"] || 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const newThisMonth = await prisma.user.count({ where: { role: "MEMBER", createdAt: { gte: startOfMonth } } });

  const ipsTotal = ipsTimeline.reduce((sum, s) => sum + s.members.length, 0);
  const cfTotal = cfTimeline.reduce((sum, s) => sum + s.members.length, 0);

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
          <div key={i} className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6 text-center">
            <div className="text-[11px] text-text-muted tracking-[2px] mb-2">{s.label}</div>
            <div className="font-mono text-4xl text-gold font-light">{s.value}</div>
            <div className="text-[11px] text-text-secondary">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ステータス別会員数（タイムラインUI） */}
      <h3 className="font-serif-jp text-base font-normal text-text-primary tracking-wider mb-4 pb-3 border-b border-border">
        ステータス別会員数
      </h3>
      <div className="mb-6 sm:mb-8">
        <DashboardTimelineTabs
          ipsCount={ipsTotal}
          cfCount={cfTotal}
          ipsContent={<TimelineView steps={ipsTimeline} hrefPrefix="/admin/members" />}
          cfContent={<TimelineView steps={cfTimeline} hrefPrefix="/admin/members" />}
        />
      </div>

      {/* 最近のステータス変更 */}
      <h3 className="font-serif-jp text-base font-normal text-text-primary tracking-wider mb-4 pb-3 border-b border-border">
        最近のステータス変更
      </h3>
      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {recentLogs.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">ステータス変更履歴はありません</div>
        ) : (
          recentLogs.map((log) => (
            <div key={log.id} className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-b-0">
              <div className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
              <div className="flex-1">
                <span className="text-[13px] text-text-primary">{log.user.name}</span>
                <span className="text-xs text-text-muted mx-2">—</span>
                <span className="text-xs text-text-secondary">{IPS_STATUS_LABELS[log.fromStatus]}</span>
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
