/**
 * 代理店・営業マンの売上/報酬サマリー計算
 *
 * 月次 = 当月 1日 00:00 〜 翌月 1日 00:00
 */

type CommissionLite = {
  saleAmount: number;
  commissionAmount: number;
  staffCommissionAmount: number;
  createdAt: Date;
};

export type CommissionSummary = {
  totalSales: number;
  monthSales: number;
  totalAgencyCommission: number;
  monthAgencyCommission: number;
  totalStaffCommission: number;
  monthStaffCommission: number;
};

export function calcSummary(commissions: CommissionLite[]): CommissionSummary {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  let totalSales = 0,
    monthSales = 0,
    totalAgencyCommission = 0,
    monthAgencyCommission = 0,
    totalStaffCommission = 0,
    monthStaffCommission = 0;

  for (const c of commissions) {
    totalSales += c.saleAmount;
    totalAgencyCommission += c.commissionAmount;
    totalStaffCommission += c.staffCommissionAmount ?? 0;

    if (c.createdAt >= monthStart && c.createdAt < nextMonthStart) {
      monthSales += c.saleAmount;
      monthAgencyCommission += c.commissionAmount;
      monthStaffCommission += c.staffCommissionAmount ?? 0;
    }
  }

  return {
    totalSales,
    monthSales,
    totalAgencyCommission,
    monthAgencyCommission,
    totalStaffCommission,
    monthStaffCommission,
  };
}
