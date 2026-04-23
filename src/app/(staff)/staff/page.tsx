import { requireStaff } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { IPS_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/types";
import StaffFormUrl from "./StaffFormUrl";
import { getIpsTimeline, getCfTimeline } from "@/lib/dashboard-timeline";
import DashboardTimelineTabs from "@/components/dashboard/DashboardTimelineTabs";
import TimelineView from "@/components/dashboard/TimelineView";
import MonthlyBarChart from "@/components/dashboard/MonthlyBarChart";

export default async function StaffDashboardPage() {
  const { staffCode, name } = await requireStaff();

  // 担当顧客一覧（統計用）
  const customers = await prisma.user.findMany({
    where: { referredByStaff: staffCode, role: "MEMBER" },
    include: {
      membership: true,
      cultureFluidOrders: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  // タイムラインデータ（自分の担当顧客のみ）
  const extraWhere = { referredByStaff: staffCode };
  const [ipsTimeline, cfTimeline] = await Promise.all([
    getIpsTimeline(extraWhere),
    getCfTimeline(extraWhere),
  ]);

  const ipsTotal = ipsTimeline.reduce((sum, s) => sum + s.members.length, 0);
  const cfTotal = cfTimeline.reduce((sum, s) => sum + s.members.length, 0);

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        ダッシュボード
      </h2>
      <p className="text-sm text-text-muted mb-6">{name}（{staffCode}）の担当顧客データ</p>

      {/* 月次グラフ */}
      <MonthlyBarChart
        apiPath="/api/staff/analytics/monthly-bar"
        defaultMetric="totalSales"
        metricOptions={[
          { value: "totalSales", label: "累計売上" },
          { value: "staffSales", label: "営業マン売上" },
          { value: "viaAgencySales", label: "代理店経由売上" },
          { value: "registrations", label: "メンバーシップ登録人数" },
          { value: "contracts", label: "成約人数（入金済）" },
        ]}
      />

      {/* 専用申込フォームURL */}
      <StaffFormUrl staffCode={staffCode} />

      {/* ステータス別顧客数（タイムラインUI） */}
      <h3 className="font-serif-jp text-base font-normal text-text-primary tracking-wider mb-4 pb-3 border-b border-border">
        ステータス別顧客数
      </h3>
      <div className="mb-6 sm:mb-8">
        <DashboardTimelineTabs
          ipsCount={ipsTotal}
          cfCount={cfTotal}
          ipsContent={<TimelineView steps={ipsTimeline} hrefPrefix="/staff/members" />}
          cfContent={<TimelineView steps={cfTimeline} hrefPrefix="/staff/members" />}
        />
      </div>

      {/* 最近の担当顧客 */}
      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <h3 className="font-serif-jp text-sm text-gold tracking-wider">最近の担当顧客</h3>
          <Link href="/staff/members" className="text-[11px] text-text-muted hover:text-gold transition-colors">すべて見る →</Link>
        </div>
        {customers.length === 0 ? (
          <div className="text-text-muted text-sm py-4 text-center">担当顧客なし</div>
        ) : (
          <div className="divide-y divide-border">
            {customers.slice(0, 10).map((c) => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] text-gold">{c.membership?.memberNumber || "---"}</span>
                    <span className="text-sm text-text-primary">{c.name}</span>
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {c.membership ? IPS_STATUS_LABELS[c.membership.ipsStatus] : "---"} ・ {c.membership ? PAYMENT_STATUS_LABELS[c.membership.paymentStatus] : "---"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

