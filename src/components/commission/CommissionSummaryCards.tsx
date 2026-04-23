import type { CommissionSummary } from "@/lib/commission-summary";

/**
 * 代理店カルテ / 従業員カルテ上部のサマリー表示
 * 累計売上｜月売上 / 累計報酬｜月報酬 / 営業マン累計報酬｜営業マン月報酬
 */
export default function CommissionSummaryCards({
  summary,
  showStaff = true,
  showAgency = true,
}: {
  summary: CommissionSummary;
  showStaff?: boolean;
  showAgency?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
      {/* 売上 */}
      <SummaryCard
        label="売上"
        total={summary.totalSales}
        month={summary.monthSales}
      />
      {/* 代理店報酬 */}
      {showAgency && (
        <SummaryCard
          label="代理店報酬"
          total={summary.totalAgencyCommission}
          month={summary.monthAgencyCommission}
        />
      )}
      {/* 営業マン報酬 */}
      {showStaff && (
        <SummaryCard
          label="営業マン報酬"
          total={summary.totalStaffCommission}
          month={summary.monthStaffCommission}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, total, month }: { label: string; total: number; month: number }) {
  return (
    <div className="bg-bg-secondary border border-border rounded-md p-4">
      <div className="text-[10px] text-text-muted tracking-wider mb-2">{label}</div>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] text-text-muted">累計</div>
          <div className="text-base sm:text-lg font-mono text-gold truncate">¥{total.toLocaleString()}</div>
        </div>
        <div className="text-right min-w-0">
          <div className="text-[10px] text-text-muted">当月</div>
          <div className="text-base sm:text-lg font-mono text-text-primary truncate">¥{month.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
