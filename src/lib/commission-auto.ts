/**
 * 代理店報酬レコードの自動生成ヘルパー
 *
 * 会員の売上（iPS契約入金完了 / 培養上清液オーダー入金完了）に対して、
 * 紹介代理店の報酬レコードを自動で作成する。
 *
 * 重複防止: (agencyProfileId, sourceType, sourceOrderId) でユニーク制約
 */

import prisma from "@/lib/prisma";

type SourceType = "IPS" | "CF";

async function upsertCommission(params: {
  agencyProfileId: string;
  memberUserId: string;
  memberName: string;
  memberNumber: string;
  saleAmount: number;
  commissionRate: number;
  sourceType: SourceType;
  sourceOrderId: string;
  noteLabel: string;
}) {
  const { agencyProfileId, memberUserId, memberName, memberNumber, saleAmount, commissionRate, sourceType, sourceOrderId, noteLabel } = params;

  const commissionAmount = Math.floor((saleAmount * commissionRate) / 100);

  // 既に同一 sourceType/sourceOrderId のレコードがあればスキップ（重複防止）
  const existing = await prisma.agencyCommission.findFirst({
    where: { agencyProfileId, sourceType, sourceOrderId },
  });
  if (existing) return null;

  return await prisma.agencyCommission.create({
    data: {
      agencyProfileId,
      memberUserId,
      memberName,
      memberNumber,
      saleAmount,
      commissionRate,
      commissionAmount,
      contributionType: "", // 備考（自由入力）は空欄でスタート
      status: "PENDING",
      note: `自動生成: ${noteLabel}`,
      sourceType,
      sourceOrderId,
    },
  });
}

/**
 * iPS契約の入金完了時に報酬レコードを自動作成
 */
export async function autoCreateCommissionForIps(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      referredByAgency: true,
      membership: {
        select: { id: true, memberNumber: true, totalAmount: true },
      },
    },
  });

  if (!user?.referredByAgency || !user.membership) return null;

  const agency = await prisma.agencyProfile.findUnique({
    where: { agencyCode: user.referredByAgency },
    select: { id: true, commissionRate: true },
  });
  if (!agency) return null;

  return await upsertCommission({
    agencyProfileId: agency.id,
    memberUserId: user.id,
    memberName: user.name,
    memberNumber: user.membership.memberNumber,
    saleAmount: user.membership.totalAmount,
    commissionRate: agency.commissionRate ?? 0,
    sourceType: "IPS",
    sourceOrderId: user.membership.id,
    noteLabel: "iPS作製・保管 基本パッケージ",
  });
}

/**
 * 培養上清液オーダーの入金完了時に報酬レコードを自動作成
 */
export async function autoCreateCommissionForCf(orderId: string) {
  const order = await prisma.cultureFluidOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      totalAmount: true,
      planLabel: true,
      userId: true,
      user: {
        select: {
          id: true,
          name: true,
          referredByAgency: true,
          membership: { select: { memberNumber: true } },
        },
      },
    },
  });

  if (!order || order.totalAmount === 0) return null; // 0円（iPS付属分）は対象外
  if (!order.user.referredByAgency || !order.user.membership) return null;

  const agency = await prisma.agencyProfile.findUnique({
    where: { agencyCode: order.user.referredByAgency },
    select: { id: true, commissionRate: true },
  });
  if (!agency) return null;

  return await upsertCommission({
    agencyProfileId: agency.id,
    memberUserId: order.user.id,
    memberName: order.user.name,
    memberNumber: order.user.membership.memberNumber,
    saleAmount: order.totalAmount,
    commissionRate: agency.commissionRate ?? 0,
    sourceType: "CF",
    sourceOrderId: order.id,
    noteLabel: order.planLabel,
  });
}
