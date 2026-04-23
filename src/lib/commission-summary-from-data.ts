/**
 * 実データ（membership / cultureFluidOrder）から売上・報酬を集計する
 * - agencyCommission が自動生成されていない既存データでも数値が出るようにする
 * - 月次判定: membership は contractSignedAt、cf は paidAt
 */

import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { CommissionSummary } from "@/lib/commission-summary";

type RateMap = {
  // staffCode -> { total: %, staff: % }
  byStaff: Record<string, { total: number; staff: number }>;
  // agencyCode -> { total: %, staff: % }
  byAgency: Record<string, { total: number; staff: number }>;
};

function inThisMonth(date: Date, now: Date): boolean {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

async function buildRateMaps(): Promise<RateMap> {
  const agencies = await prisma.user.findMany({
    where: { role: "AGENCY" },
    select: {
      referredByStaff: true,
      agencyProfile: {
        select: {
          agencyCode: true,
          commissionRate: true,
          staffCommissionRate: true,
        },
      },
    },
  });

  const byStaff: Record<string, { total: number; staff: number }> = {};
  const byAgency: Record<string, { total: number; staff: number }> = {};

  for (const a of agencies) {
    if (!a.agencyProfile) continue;
    const total = a.agencyProfile.commissionRate ?? 0;
    const staff = a.agencyProfile.staffCommissionRate ?? 0;
    byAgency[a.agencyProfile.agencyCode] = { total, staff };
    if (a.referredByStaff) {
      // 同じ staff が複数代理店を担当している場合は最後勝ち（基本的に同値と想定）
      byStaff[a.referredByStaff] = { total, staff };
    }
  }

  return { byStaff, byAgency };
}

/**
 * 全体サマリー（エージェント一覧向け）: 代理店経由の会員すべて
 */
export async function calcSummaryForAllAgencies(): Promise<CommissionSummary> {
  const rateMap = await buildRateMaps();
  return await calcSummaryFromSource({
    rateMap,
    // agency 経由 = referredByAgency あり
    filter: { referredByAgency: { not: null } },
  });
}

/**
 * 特定代理店のサマリー（代理店カルテ向け）
 */
export async function calcSummaryForAgency(agencyCode: string): Promise<CommissionSummary> {
  const rateMap = await buildRateMaps();
  return await calcSummaryFromSource({
    rateMap,
    filter: { referredByAgency: agencyCode },
  });
}

/**
 * 従業員向けサマリー型
 * 売上:
 * - totalDirectSales / monthDirectSales: 直接紹介分の売上（営業マン売上）
 * - totalViaAgencySales / monthViaAgencySales: 担当代理店経由分の売上
 * 報酬（現状は管理ページでは使用せず将来用に保持）:
 * - totalStaffCommission / monthStaffCommission
 * - totalAgencyDistribution / monthAgencyDistribution
 */
export type StaffSummary = CommissionSummary & {
  totalDirectSales: number;
  monthDirectSales: number;
  totalViaAgencySales: number;
  monthViaAgencySales: number;
  totalAgencyDistribution: number;
  monthAgencyDistribution: number;
};

/**
 * 全営業マン合算サマリー（従業員一覧向け）
 * 直接担当 → 営業マン売上報酬 / 担当代理店経由 → 代理店分配報酬
 */
export async function calcSummaryForAllStaff(): Promise<StaffSummary> {
  const rateMap = await buildRateMaps();

  // 担当代理店コードの集合
  const managed = await prisma.user.findMany({
    where: { role: "AGENCY", referredByStaff: { not: null } },
    select: { agencyProfile: { select: { agencyCode: true } } },
  });
  const managedAgencyCodes = managed
    .map((a) => a.agencyProfile?.agencyCode)
    .filter((c): c is string => !!c);

  return await calcStaffSummary({
    rateMap,
    directFilter: { referredByStaff: { not: null } },
    viaAgencyCodes: managedAgencyCodes,
  });
}

/**
 * 特定従業員のサマリー（従業員カルテ向け）
 */
export async function calcSummaryForStaff(staffCode: string): Promise<StaffSummary> {
  const rateMap = await buildRateMaps();

  const managed = await prisma.user.findMany({
    where: { role: "AGENCY", referredByStaff: staffCode },
    select: { agencyProfile: { select: { agencyCode: true } } },
  });
  const managedAgencyCodes = managed
    .map((a) => a.agencyProfile?.agencyCode)
    .filter((c): c is string => !!c);

  return await calcStaffSummary({
    rateMap,
    directFilter: { referredByStaff: staffCode },
    viaAgencyCodes: managedAgencyCodes,
  });
}

/**
 * 従業員向け売上・報酬集計（直接紹介 / 代理店経由で分離）
 */
async function calcStaffSummary(params: {
  rateMap: RateMap;
  directFilter: Prisma.UserWhereInput;
  viaAgencyCodes: string[];
}): Promise<StaffSummary> {
  const { rateMap, directFilter, viaAgencyCodes } = params;
  const now = new Date();

  // 対象会員を一括取得
  const members = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      OR: [
        directFilter,
        ...(viaAgencyCodes.length > 0 ? [{ referredByAgency: { in: viaAgencyCodes } }] : []),
      ],
    },
    select: {
      referredByAgency: true,
      referredByStaff: true,
      membership: {
        select: {
          paidAmount: true,
          contractSignedAt: true,
          updatedAt: true,
        },
      },
      cultureFluidOrders: {
        where: { paymentStatus: "COMPLETED" },
        select: { totalAmount: true, paidAt: true, updatedAt: true },
      },
    },
  });

  let totalSales = 0,
    monthSales = 0,
    totalDirectSales = 0,
    monthDirectSales = 0,
    totalViaAgencySales = 0,
    monthViaAgencySales = 0,
    totalStaffCommission = 0,
    monthStaffCommission = 0,
    totalAgencyDistribution = 0,
    monthAgencyDistribution = 0;

  for (const m of members) {
    const rate = resolveRate(rateMap, m.referredByAgency, m.referredByStaff);
    const agencyRate = Math.max(0, rate.total - rate.staff);

    const isViaAgency = !!m.referredByAgency && viaAgencyCodes.includes(m.referredByAgency);

    const accumulate = (amt: number, inMonth: boolean) => {
      totalSales += amt;
      if (inMonth) monthSales += amt;

      if (isViaAgency) {
        // 担当代理店経由
        totalViaAgencySales += amt;
        if (inMonth) monthViaAgencySales += amt;
        const dist = Math.floor((amt * agencyRate) / 100);
        totalAgencyDistribution += dist;
        if (inMonth) monthAgencyDistribution += dist;
      } else {
        // 直接紹介
        totalDirectSales += amt;
        if (inMonth) monthDirectSales += amt;
        const staffComm = Math.floor((amt * rate.total) / 100);
        totalStaffCommission += staffComm;
        if (inMonth) monthStaffCommission += staffComm;
      }
    };

    if (m.membership && m.membership.paidAmount > 0) {
      const d = m.membership.contractSignedAt || m.membership.updatedAt;
      accumulate(m.membership.paidAmount, d ? inThisMonth(d, now) : false);
    }
    for (const o of m.cultureFluidOrders) {
      if (o.totalAmount === 0) continue;
      const d = o.paidAt || o.updatedAt;
      accumulate(o.totalAmount, d ? inThisMonth(d, now) : false);
    }
  }

  return {
    totalSales,
    monthSales,
    totalDirectSales,
    monthDirectSales,
    totalViaAgencySales,
    monthViaAgencySales,
    totalAgencyCommission: 0,
    monthAgencyCommission: 0,
    totalStaffCommission,
    monthStaffCommission,
    totalAgencyDistribution,
    monthAgencyDistribution,
  };
}

async function calcSummaryFromSource(params: {
  rateMap: RateMap;
  filter: Prisma.UserWhereInput;
}): Promise<CommissionSummary> {
  const { rateMap, filter } = params;
  const now = new Date();

  const members = await prisma.user.findMany({
    where: { role: "MEMBER", ...filter },
    select: {
      referredByAgency: true,
      referredByStaff: true,
      membership: {
        select: {
          paidAmount: true,
          paymentStatus: true,
          contractSignedAt: true,
          updatedAt: true,
        },
      },
      cultureFluidOrders: {
        where: { paymentStatus: "COMPLETED" },
        select: { totalAmount: true, paidAt: true, updatedAt: true },
      },
    },
  });

  let totalSales = 0,
    monthSales = 0,
    totalAgencyCommission = 0,
    monthAgencyCommission = 0,
    totalStaffCommission = 0,
    monthStaffCommission = 0;

  for (const m of members) {
    const rate = resolveRate(rateMap, m.referredByAgency, m.referredByStaff);
    const agencyRate = Math.max(0, rate.total - rate.staff);
    const staffRate = rate.staff;

    // iPS契約 paidAmount
    if (m.membership && m.membership.paidAmount > 0) {
      const paid = m.membership.paidAmount;
      totalSales += paid;
      totalAgencyCommission += Math.floor((paid * agencyRate) / 100);
      totalStaffCommission += Math.floor((paid * staffRate) / 100);

      const d = m.membership.contractSignedAt || m.membership.updatedAt;
      if (d && inThisMonth(d, now)) {
        monthSales += paid;
        monthAgencyCommission += Math.floor((paid * agencyRate) / 100);
        monthStaffCommission += Math.floor((paid * staffRate) / 100);
      }
    }

    // CF オーダー（入金済み）
    for (const o of m.cultureFluidOrders) {
      if (o.totalAmount === 0) continue;
      totalSales += o.totalAmount;
      totalAgencyCommission += Math.floor((o.totalAmount * agencyRate) / 100);
      totalStaffCommission += Math.floor((o.totalAmount * staffRate) / 100);

      const d = o.paidAt || o.updatedAt;
      if (d && inThisMonth(d, now)) {
        monthSales += o.totalAmount;
        monthAgencyCommission += Math.floor((o.totalAmount * agencyRate) / 100);
        monthStaffCommission += Math.floor((o.totalAmount * staffRate) / 100);
      }
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

function resolveRate(
  rateMap: RateMap,
  referredByAgency: string | null,
  referredByStaff: string | null,
): { total: number; staff: number } {
  if (referredByAgency && rateMap.byAgency[referredByAgency]) {
    return rateMap.byAgency[referredByAgency];
  }
  if (referredByStaff && rateMap.byStaff[referredByStaff]) {
    return rateMap.byStaff[referredByStaff];
  }
  return { total: 0, staff: 0 };
}
