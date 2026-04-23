import { requireAdmin } from "@/lib/auth-helpers";
import { IPS_STATUS_LABELS } from "@/types";
import { getIpsTimeline, getCfTimeline } from "@/lib/dashboard-timeline";
import { fetchMonthlyLineData, fetchOverallTotal } from "@/lib/dashboard-analytics";
import DashboardTimelineTabs from "@/components/dashboard/DashboardTimelineTabs";
import TimelineView from "@/components/dashboard/TimelineView";
import DashboardCharts from "./DashboardCharts";
import prisma from "@/lib/prisma";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const [recentLogs, ipsTimeline, cfTimeline, monthlyData, overall] = await Promise.all([
    prisma.statusHistory.findMany({
      take: 10,
      orderBy: { changedAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
    getIpsTimeline(),
    getCfTimeline(),
    fetchMonthlyLineData(),
    fetchOverallTotal(),
  ]);

  const ipsTotal = ipsTimeline.reduce((sum, s) => sum + s.members.length, 0);
  const cfTotal = cfTimeline.reduce((sum, s) => sum + s.members.length, 0);

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        管理ダッシュボード
      </h2>

      {/* グラフエリア（累計/従業員別） */}
      <DashboardCharts monthlyData={monthlyData} overall={overall} />

      {/* 状況別会員数（タイムラインUI） */}
      <h3 className="font-serif-jp text-base font-normal text-text-primary tracking-wider mb-4 pb-3 border-b border-border">
        状況別会員数
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
