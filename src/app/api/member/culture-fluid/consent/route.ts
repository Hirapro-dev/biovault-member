import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 培養上清液 事前説明・同意
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as any).id;
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

  await prisma.cultureFluidOrder.update({
    where: { id: orderId },
    data: {
      informedAgreedAt: new Date(),
      status: order.status === "CLINIC_BOOKING" ? "INFORMED_AGREED" : order.status,
    },
  });

  return NextResponse.json({ success: true });
}
