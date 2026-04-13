import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notifyCultureFluidStatusChange } from "@/lib/status-notification";

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

  // 通知送信
  const newStatus = order.status === "CLINIC_BOOKING" ? "INFORMED_AGREED" : order.status;
  if (newStatus !== order.status) {
    const member = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, membership: { select: { memberNumber: true } } } });
    if (member) {
      notifyCultureFluidStatusChange({
        userId,
        memberName: member.name,
        memberNumber: member.membership?.memberNumber,
        planLabel: order.planLabel,
        fromStatus: order.status,
        toStatus: newStatus,
        changedBy: "会員本人",
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true });
}
