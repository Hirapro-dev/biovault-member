import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};

  // 本部確認
  if (body.action === "confirm") {
    data.status = body.paymentMethod === "bank_transfer" ? "AWAITING_PAYMENT" : "CONFIRMED";
    data.confirmedAt = new Date();
    if (body.bankInfo) data.bankInfo = body.bankInfo;
  }
  // 入金確認
  if (body.action === "paid") {
    data.status = "PAID";
    data.paidAt = new Date();
  }
  // 本部発注済
  if (body.action === "ordered") {
    data.status = "ORDERED";
    data.orderedAt = new Date();
  }
  // キャンセル
  if (body.action === "cancel") {
    data.status = "CANCELLED";
  }
  // メモ更新
  if (body.adminNote !== undefined) {
    data.adminNote = body.adminNote;
  }

  const request = await prisma.printRequest.update({ where: { id }, data });
  return NextResponse.json(request);
}
