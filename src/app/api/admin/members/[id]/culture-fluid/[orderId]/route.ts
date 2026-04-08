import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 培養上清液注文ステータス更新
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; orderId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id, orderId } = await params;
  const body = await req.json();

  const order = await prisma.cultureFluidOrder.findFirst({
    where: { id: orderId, userId: id },
  });

  if (!order) {
    return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};

  // ステータス更新
  if (body.status) updateData.status = body.status;

  // 入金確認
  if (body.paymentStatus) {
    updateData.paymentStatus = body.paymentStatus;
    if (body.paymentStatus === "COMPLETED") {
      updateData.paidAt = new Date();
      updateData.status = "PAYMENT_CONFIRMED";
    }
  }

  // 精製完了日 → 管理期限自動算出（+8ヶ月）
  if (body.producedAt) {
    const produced = new Date(body.producedAt);
    const expires = new Date(produced);
    expires.setMonth(expires.getMonth() + 8);
    updateData.producedAt = produced;
    updateData.expiresAt = expires;
    updateData.status = "PRODUCING";
  }

  // クリニック情報
  if (body.clinicDate) updateData.clinicDate = new Date(body.clinicDate);
  if (body.clinicName !== undefined) updateData.clinicName = body.clinicName;
  if (body.clinicAddress !== undefined) updateData.clinicAddress = body.clinicAddress;
  if (body.clinicPhone !== undefined) updateData.clinicPhone = body.clinicPhone;

  const updated = await prisma.cultureFluidOrder.update({
    where: { id: orderId },
    data: updateData,
  });

  return NextResponse.json(updated);
}
