import type { CommissionSummary } from "@/lib/commission-summary";

type StaffSummary = CommissionSummary & {
  // 担当代理店経由分の「代理店分配報酬」（従業員向け）
  totalAgencyDistribution?: number;
  monthAgencyDistribution?: number;
};

/**
 * 代理店カルテ / 従業員カルテ上部のサマリー表示
 *
 * 代理店カルテ: 売上 / 代理店報酬 / 営業マン報酬
 * 従業員カルテ: 売上 / 営業マン売上報酬 / 代理店分配報酬
 */
export default function CommissionSummaryCards({
  summary,
  showStaff = true,
  showAgency = true,
  variant = "agency",
}: {
  summary: StaffSummary;
  showStaff?: boolean;
  showAgency?: boolean;
  variant?: "agency" | "staff";
}) {
  // 従業員向け表示: 売上 / 営業マン売上報酬 / 代理店分配報酬
  if (variant === "staff") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <SummaryCard label="売上" total={summary.totalSales} month={summary.monthSales} />
        <SummaryCard
          label="営業マン売上報酬"
          total={summary.totalStaffCommission}
          month={summary.monthStaffCommission}
        />
        <SummaryCard
          label="代理店分配報酬"
          total={summary.totalAgencyDistribution ?? 0}
          month={summary.monthAgencyDistribution ?? 0}
        />
      </div>
    );
  }

  // 代理店向け表示（従来通り）
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
      <SummaryCard label="売上" total={summary.totalSales} month={summary.monthSales} />
      {showAgency && (
        <SummaryCard
          label="代理店報酬"
          total={summary.totalAgencyCommission}
          month={summary.monthAgencyCommission}
        />
      )}
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
