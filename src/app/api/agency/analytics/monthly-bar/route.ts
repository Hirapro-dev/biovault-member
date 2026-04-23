import { NextResponse } from "next/server";
import { requireAgency } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import {
  fetchMonthlyBarData,
  type MonthlyBarMetric,
} from "@/lib/dashboard-analytics";

// 代理店が参照できるメトリックは売上と人数のみ（自分経由なので staffSales / viaAgencySales の区別不要）
const AGENCY_METRICS: MonthlyBarMetric[] = [
  "totalSales",
  "registrations",
  "contracts",
];

/**
 * 代理店ダッシュボード用: 自分経由の会員の月次棒グラフデータを取得
 */
export async function GET(req: Request) {
  const session = await requireAgency();

  const profile = await prisma.agencyProfile.findUnique({
    where: { userId: session.id },
    select: { agencyCode: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "プロフィールが見つかりません" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const metric = searchParams.get("metric") as MonthlyBarMetric;
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : new Date().getFullYear();

  if (!AGENCY_METRICS.includes(metric)) {
    return NextResponse.json({ error: "不正なパラメータ" }, { status: 400 });
  }

  const data = await fetchMonthlyBarData({
    metric,
    year,
    scope: { kind: "agency", agencyCode: profile.agencyCode },
  });

  return NextResponse.json({ data });
}
