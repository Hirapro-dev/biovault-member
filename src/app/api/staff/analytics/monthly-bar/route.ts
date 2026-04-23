import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth-helpers";
import {
  fetchMonthlyBarData,
  type MonthlyBarMetric,
} from "@/lib/dashboard-analytics";

const METRICS: MonthlyBarMetric[] = [
  "totalSales",
  "staffSales",
  "viaAgencySales",
  "registrations",
  "contracts",
];

/**
 * 従業員ダッシュボード用: 自分の月次棒グラフデータを取得
 */
export async function GET(req: Request) {
  const { staffCode } = await requireStaff();

  const { searchParams } = new URL(req.url);
  const metric = searchParams.get("metric") as MonthlyBarMetric;
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : new Date().getFullYear();

  if (!METRICS.includes(metric)) {
    return NextResponse.json({ error: "不正なパラメータ" }, { status: 400 });
  }

  const data = await fetchMonthlyBarData({
    metric,
    year,
    scope: { kind: "staff", staffCode },
  });

  return NextResponse.json({ data });
}
