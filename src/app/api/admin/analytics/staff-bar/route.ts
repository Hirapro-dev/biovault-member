import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  fetchStaffBarData,
  type StaffMetric,
  type PeriodKind,
} from "@/lib/dashboard-analytics";

const METRICS: StaffMetric[] = [
  "totalSales",
  "staffSales",
  "viaAgencySales",
  "registrations",
  "contracts",
];
const KINDS: PeriodKind[] = ["all", "year", "quarter", "month"];

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes(
      (session.user as { role: string }).role,
    )
  ) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const metric = searchParams.get("metric") as StaffMetric;
  const kind = searchParams.get("kind") as PeriodKind;
  const year = searchParams.get("year") ? Number(searchParams.get("year")) : undefined;
  const quarter = searchParams.get("quarter") ? Number(searchParams.get("quarter")) : undefined;
  const month = searchParams.get("month") ? Number(searchParams.get("month")) : undefined;

  if (!METRICS.includes(metric) || !KINDS.includes(kind)) {
    return NextResponse.json({ error: "不正なパラメータ" }, { status: 400 });
  }

  const data = await fetchStaffBarData({ metric, kind, year, quarter, month });
  return NextResponse.json({ data });
}
