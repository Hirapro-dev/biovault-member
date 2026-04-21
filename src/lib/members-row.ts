/**
 * 会員一覧の行データ生成ヘルパー
 *
 * admin / staff / agency の3ロールで共通利用。
 * Prismaクエリで取得した会員データを MembersTable の MemberRow に変換する。
 */

import { getCurrentStep } from "@/lib/dashboard-timeline";
import type { MemberRow } from "@/components/members/MembersTable";

type MemberSource = {
  id: string;
  name: string;
  isIdIssued: boolean;
  hasAgreedTerms: boolean;
  createdAt: Date;
  membership: {
    memberNumber: string;
    ipsStatus: string;
    paymentStatus: string;
    contractSignedAt: Date | null;
    clinicDate: Date | null;
    totalAmount: number;
    paidAmount: number;
    storageStartAt: Date | null;
    storageYears: number;
    updatedAt: Date;
  } | null;
  documents: { type: string; status: string }[];
  cultureFluidOrders: {
    status: string;
    producedAt: Date | null;
    expiresAt: Date | null;
    totalAmount: number;
    paymentStatus: string;
    updatedAt: Date;
  }[];
  statusHistory: { changedAt: Date }[];
};

/**
 * Prismaから取得した会員データを MemberRow に変換
 *
 * @param member - 会員データ
 * @param assignedName - 担当者名（ロールごとに取得方法が異なるため外部から渡す）
 */
export function buildMemberRow(member: MemberSource, assignedName: string): MemberRow {
  const now = new Date();

  // iPS現在ステップ
  let ipsStepKey = "TERMS_AGREED";
  let ipsCompleted = false;
  let ipsExpired = false;
  if (member.membership) {
    const signedDocs = member.documents.filter((d) => d.status === "SIGNED").map((d) => d.type);
    ipsStepKey = getCurrentStep(
      member.membership.ipsStatus,
      member.isIdIssued,
      member.hasAgreedTerms,
      signedDocs,
      member.membership.contractSignedAt,
      member.membership.paymentStatus,
      member.membership.clinicDate,
    );
    ipsCompleted = member.membership.ipsStatus === "STORAGE_ACTIVE";
    // 保管期限切れ判定：STORAGE_EXPIRED もしくは storageStartAt + storageYears を経過
    if (member.membership.ipsStatus === "STORAGE_EXPIRED") {
      ipsExpired = true;
    } else if (ipsCompleted && member.membership.storageStartAt) {
      const expiresAt = new Date(member.membership.storageStartAt);
      expiresAt.setFullYear(expiresAt.getFullYear() + member.membership.storageYears);
      if (expiresAt < now) ipsExpired = true;
    }
  }

  // 培養上清液の最新オーダー
  const latestCf = member.cultureFluidOrders[0];
  let cfStepKey: string | null = null;
  let cfCompleted = false;
  let cfExpired = false;
  if (latestCf) {
    cfStepKey = latestCf.status === "PRODUCING" && latestCf.producedAt ? "CF_STORAGE" : latestCf.status;
    cfCompleted = latestCf.status === "COMPLETED";
    // 保管期限切れ判定：expiresAt を経過（保管中/施術完了に関わらず）
    if (latestCf.expiresAt && latestCf.expiresAt < now) {
      cfExpired = true;
    }
  }

  // 売上額 = iPS支払済額 + 入金済培養上清液の合計
  const cfPaidTotal = member.cultureFluidOrders
    .filter((o) => o.paymentStatus === "COMPLETED")
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const salesAmount = (member.membership?.paidAmount ?? 0) + cfPaidTotal;

  // 最終進捗日
  const progressCandidates: (Date | null | undefined)[] = [
    member.statusHistory[0]?.changedAt,
    member.cultureFluidOrders[0]?.updatedAt,
    member.membership?.updatedAt,
  ];
  const progressDates = progressCandidates.filter((d): d is Date => d instanceof Date);
  const lastProgressAt = progressDates.length
    ? progressDates.reduce((a, b) => (a > b ? a : b))
    : null;

  return {
    id: member.id,
    name: member.name,
    memberNumber: member.membership?.memberNumber ?? null,
    assignedName,
    ipsStepKey,
    ipsCompleted,
    ipsExpired,
    cfStepKey,
    cfCompleted,
    cfExpired,
    salesAmount,
    createdAt: member.createdAt,
    lastProgressAt,
  };
}

/**
 * Prismaクエリ共通の include 定義
 */
export const MEMBER_INCLUDE = {
  membership: true,
  documents: { select: { type: true, status: true } },
  cultureFluidOrders: {
    orderBy: { updatedAt: "desc" as const },
    select: {
      status: true,
      producedAt: true,
      expiresAt: true,
      totalAmount: true,
      paymentStatus: true,
      updatedAt: true,
    },
  },
  statusHistory: {
    orderBy: { changedAt: "desc" as const },
    take: 1,
    select: { changedAt: true },
  },
};
