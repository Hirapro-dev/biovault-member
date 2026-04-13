import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * 培養上清液 留意事項同意API
 *
 * iPSサービス付属分など、申込フローを通らない注文に対して
 * クリニック予約前に留意事項への同意を記録する。
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
    return NextResponse.json({ error: "注文IDは必須です" }, { status: 400 });
  }

  const order = await prisma.cultureFluidOrder.findFirst({
    where: { id: orderId, userId },
  });

  if (!order) {
    return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
  }

  if (order.cautionAgreedAt) {
    return NextResponse.json({ success: true, alreadyAgreed: true });
  }

  await prisma.cultureFluidOrder.update({
    where: { id: orderId },
    data: { cautionAgreedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
