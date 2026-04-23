/**
 * 管理者ダッシュボード用の集計ヘルパー
 *
 * - 月次折れ線: 売上 / メンバーシップ登録数 / 成約数（入金済数）の新規発生値
 * - 従業員別棒グラフ: 累計売上 / 営業マン売上 / 代理店経由売上 / 登録人数 / 成約人数
 */

import prisma from "@/lib/prisma";

type RateMap = Record<string, { total: number; staff: number }>; // agencyCode -> rate

async function buildAgencyRateMap(): Promise<RateMap> {
  const profiles = await prisma.agencyProfile.findMany({
    select: { agencyCode: true, commissionRate: true, staffCommissionRate: true },
  });
  const map: RateMap = {};
  for (const p of profiles) {
    map[p.agencyCode] = {
      total: p.commissionRate ?? 0,
      staff: p.staffCommissionRate ?? 0,
    };
  }
  return map;
}

// ────────────────────────────────────────
// 累計タブ: 月次折れ線
// ────────────────────────────────────────

export type LineMetric = "sales" | "registrations" | "contracts";

export type MonthlyPoint = {
  ym: string; // "2026-04"
  sales: number;
  registrations: number;
  contracts: number;
};

function ym(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function* iterateMonths(from: Date, to: Date): Generator<string> {
  const d = new Date(from.getFullYear(), from.getMonth(), 1);
  const end = new Date(to.getFullYear(), to.getMonth(), 1);
  while (d <= end) {
    yield ym(d);
    d.setMonth(d.getMonth() + 1);
  }
}

export async function fetchMonthlyLineData(): Promise<MonthlyPoint[]> {
  const memberships = await prisma.membership.findMany({
    select: {
      paidAmount: true,
      contractDate: true,
      contractSignedAt: true,
      createdAt: true,
      paymentStatus: true,
    },
  });

  const cfOrders = await prisma.cultureFluidOrder.findMany({
    where: { paymentStatus: "COMPLETED" },
    select: { totalAmount: true, paidAt: true, updatedAt: true },
  });

  const map: Record<string, MonthlyPoint> = {};
  const ensure = (k: string): MonthlyPoint => {
    if (!map[k]) map[k] = { ym: k, sales: 0, registrations: 0, contracts: 0 };
    return map[k];
  };

  // メンバーシップ登録 (contractDate 基準)
  for (const m of memberships) {
    const regKey = ym(m.contractDate);
    ensure(regKey).registrations += 1;

    // 成約（入金済）と売上: 入金のあったものをカウント
    if (m.paymentStatus === "COMPLETED" && m.paidAmount > 0) {
      const paidKey = ym(m.contractSignedAt || m.contractDate);
      ensure(paidKey).contracts += 1;
      ensure(paidKey).sales += m.paidAmount;
    }
  }

  // 培養上清液（入金済）: 売上のみ
  for (const o of cfOrders) {
    if (o.totalAmount === 0) continue;
    const d = o.paidAt || o.updatedAt;
    ensure(ym(d)).sales += o.totalAmount;
  }

  // 最初の月 〜 今月までを埋める
  const keys = Object.keys(map).sort();
  if (keys.length === 0) return [];

  const firstKey = keys[0];
  const firstDate = new Date(`${firstKey}-01T00:00:00`);
  const now = new Date();

  const points: MonthlyPoint[] = [];
  for (const k of iterateMonths(firstDate, now)) {
    points.push(map[k] ?? { ym: k, sales: 0, registrations: 0, contracts: 0 });
  }
  return points;
}

// ────────────────────────────────────────
// 累計タブ: サマリーカード（全期間合計）
// ────────────────────────────────────────

export type OverallTotal = {
  totalSales: number;
  totalRegistrations: number;
  totalContracts: number;
};

export async function fetchOverallTotal(): Promise<OverallTotal> {
  const points = await fetchMonthlyLineData();
  return points.reduce<OverallTotal>(
    (acc, p) => ({
      totalSales: acc.totalSales + p.sales,
      totalRegistrations: acc.totalRegistrations + p.registrations,
      totalContracts: acc.totalContracts + p.contracts,
    }),
    { totalSales: 0, totalRegistrations: 0, totalContracts: 0 },
  );
}

// ────────────────────────────────────────
// 従業員別タブ: 棒グラフ
// ────────────────────────────────────────

export type StaffMetric =
  | "totalSales"
  | "staffSales"
  | "viaAgencySales"
  | "registrations"
  | "contracts";

export type PeriodKind = "all" | "year" | "quarter" | "month";

export type StaffBarPoint = {
  staffCode: string;
  name: string;
  value: number;
};

export type StaffBarRequest = {
  metric: StaffMetric;
  kind: PeriodKind;
  year?: number;
  quarter?: number; // 1-4
  month?: number; // 1-12
};

function inPeriod(date: Date, req: StaffBarRequest): boolean {
  if (req.kind === "all") return true;
  if (req.kind === "year" && req.year) {
    return date.getFullYear() === req.year;
  }
  if (req.kind === "quarter" && req.year && req.quarter) {
    const q = Math.floor(date.getMonth() / 3) + 1;
    return date.getFullYear() === req.year && q === req.quarter;
  }
  if (req.kind === "month" && req.year && req.month) {
    return date.getFullYear() === req.year && date.getMonth() + 1 === req.month;
  }
  return false;
}

export async function fetchStaffBarData(req: StaffBarRequest): Promise<StaffBarPoint[]> {
  const staffs = await prisma.staff.findMany({
    where: { isActive: true },
    select: { staffCode: true, name: true },
    orderBy: { staffCode: "asc" },
  });

  const rateMap = await buildAgencyRateMap();

  // 従業員が担当する代理店コード一覧
  const managed = await prisma.user.findMany({
    where: { role: "AGENCY", referredByStaff: { not: null } },
    select: { referredByStaff: true, agencyProfile: { select: { agencyCode: true } } },
  });
  const managedByStaff: Record<string, string[]> = {};
  for (const m of managed) {
    if (!m.referredByStaff || !m.agencyProfile) continue;
    (managedByStaff[m.referredByStaff] ||= []).push(m.agencyProfile.agencyCode);
  }

  // 全対象会員を一括取得
  const members = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      OR: [
        { referredByStaff: { not: null } },
        { referredByAgency: { not: null } },
      ],
    },
    select: {
      referredByStaff: true,
      referredByAgency: true,
      membership: {
        select: {
          paidAmount: true,
          paymentStatus: true,
          contractDate: true,
          contractSignedAt: true,
        },
      },
      cultureFluidOrders: {
        where: { paymentStatus: "COMPLETED" },
        select: { totalAmount: true, paidAt: true, updatedAt: true },
      },
    },
  });

  const results: StaffBarPoint[] = [];

  for (const s of staffs) {
    const viaAgencyCodes = new Set(managedByStaff[s.staffCode] ?? []);
    let value = 0;

    for (const m of members) {
      const isDirect = m.referredByStaff === s.staffCode;
      const isViaAgency = !!m.referredByAgency && viaAgencyCodes.has(m.referredByAgency);
      if (!isDirect && !isViaAgency) continue;

      if (req.metric === "registrations") {
        if (m.membership && inPeriod(m.membership.contractDate, req)) {
          value += 1;
        }
        continue;
      }

      if (req.metric === "contracts") {
        if (
          m.membership &&
          m.membership.paymentStatus === "COMPLETED" &&
          m.membership.paidAmount > 0
        ) {
          const d = m.membership.contractSignedAt || m.membership.contractDate;
          if (inPeriod(d, req)) value += 1;
        }
        continue;
      }

      // 売上系メトリック
      const considerDirect = req.metric === "totalSales" || req.metric === "staffSales";
      const considerViaAgency = req.metric === "totalSales" || req.metric === "viaAgencySales";

      const accumulate = (amt: number, d: Date | null) => {
        if (!d || !inPeriod(d, req)) return;
        value += amt;
      };

      if (isDirect && considerDirect) {
        if (m.membership && m.membership.paidAmount > 0) {
          accumulate(m.membership.paidAmount, m.membership.contractSignedAt || m.membership.contractDate);
        }
        for (const o of m.cultureFluidOrders) {
          if (o.totalAmount === 0) continue;
          accumulate(o.totalAmount, o.paidAt || o.updatedAt);
        }
      } else if (isViaAgency && considerViaAgency) {
        if (m.membership && m.membership.paidAmount > 0) {
          accumulate(m.membership.paidAmount, m.membership.contractSignedAt || m.membership.contractDate);
        }
        for (const o of m.cultureFluidOrders) {
          if (o.totalAmount === 0) continue;
          accumulate(o.totalAmount, o.paidAt || o.updatedAt);
        }
      }
    }

    results.push({ staffCode: s.staffCode, name: s.name, value });
    // rateMap は将来の報酬計算用。現状は売上のみなので未使用
    void rateMap;
  }

  return results;
}
