import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * 培養上清液サービス クリニック予約リクエスト
 *
 * 会員がクリニックの施術予約を申し込む。
 * ステータスが PRODUCING（精製完了・管理保管中）の注文のみ受け付ける。
 * 申込後、ステータスを CLINIC_BOOKING に遷移し、管理者が予約手配を行う。
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json();
  const { orderId } = body;

  if (!orderId) {
    return NextResponse.json({ error: "注文IDが必要です" }, { status: 400 });
  }

  // 注文の所有者チェック
  const order = await prisma.cultureFluidOrder.findFirst({
    where: { id: orderId, userId },
  });

  if (!order) {
    return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
  }

  // PRODUCING ステータスのみ受付（精製完了後にクリニック予約を申し込む）
  if (order.status !== "PRODUCING") {
    return NextResponse.json(
      { error: "現在のステータスではクリニック予約を申し込めません" },
      { status: 400 }
    );
  }

  // ステータスを CLINIC_BOOKING に遷移
  await prisma.cultureFluidOrder.update({
    where: { id: orderId },
    data: { status: "CLINIC_BOOKING" },
  });

  return NextResponse.json({ success: true });
}
