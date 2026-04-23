import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { CommissionStatus } from "@prisma/client";

// 報酬レコード更新（報酬率・ステータス・備考の編集）
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; commissionId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as { role: string }).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { commissionId } = await params;
  const body = await req.json();

  const commission = await prisma.agencyCommission.findUnique({
    where: { id: commissionId },
  });
  if (!commission) {
    return NextResponse.json({ error: "報酬レコードが見つかりません" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  // 代理店報酬率更新（commissionAmount を再計算）
  if (typeof body.commissionRate === "number") {
    updateData.commissionRate = body.commissionRate;
    updateData.commissionAmount = Math.floor((commission.saleAmount * body.commissionRate) / 100);
  }

  // 営業マン報酬率更新（staffCommissionAmount を再計算）
  if (typeof body.staffCommissionRate === "number") {
    updateData.staffCommissionRate = body.staffCommissionRate;
    updateData.staffCommissionAmount = Math.floor((commission.saleAmount * body.staffCommissionRate) / 100);
  }

  // ステータス更新
  if (body.status) {
    updateData.status = body.status as CommissionStatus;
    // 支払済にした瞬間 paidAt を記録
    if (body.status === "PAID" && commission.status !== "PAID") {
      updateData.paidAt = new Date();
    }
    // 支払済以外に戻したら paidAt をクリア
    if (body.status !== "PAID" && commission.paidAt) {
      updateData.paidAt = null;
    }
  }

  // 備考（contributionType は現状「備考」フィールドとして流用）
  if (body.contributionType !== undefined) {
    updateData.contributionType = body.contributionType;
  }

  const updated = await prisma.agencyCommission.update({
    where: { id: commissionId },
    data: updateData,
  });

  return NextResponse.json(updated);
}

// 報酬レコード削除
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; commissionId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR"].includes((session.user as { role: string }).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { commissionId } = await params;

  await prisma.agencyCommission.delete({ where: { id: commissionId } });

  return NextResponse.json({ success: true });
}
