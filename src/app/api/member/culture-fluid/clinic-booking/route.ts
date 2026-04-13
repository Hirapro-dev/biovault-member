import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getRemainingSessions } from "@/lib/culture-fluid-plans";
import { notifyCultureFluidStatusChange } from "@/lib/status-notification";

/**
 * 培養上清液サービス クリニック予約リクエスト
 *
 * 会員がクリニックの施術予約を申し込む。
 * ステータスが PRODUCING（精製完了・管理保管中）の注文のみ受け付ける。
 * 申込後、ステータスを CLINIC_BOOKING に遷移し、管理者が予約手配を行う。
 *
 * sessionCount: 1回の施術で使用する回数（1〜3、残り回数以下）
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const body = await req.json();
  const { orderId, sessionCount = 1 } = body;

  if (!orderId) {
    return NextResponse.json({ error: "注文IDが必要です" }, { status: 400 });
  }

  // sessionCount のバリデーション（1〜3の整数）
  const count = Number(sessionCount);
  if (!Number.isInteger(count) || count < 1 || count > 3) {
    return NextResponse.json({ error: "施術回数は1〜3回で選択してください" }, { status: 400 });
  }

  // 注文の所有者チェック
  const order = await prisma.cultureFluidOrder.findFirst({
    where: { id: orderId, userId },
  });

  if (!order) {
    return NextResponse.json({ error: "注文が見つかりません" }, { status: 404 });
  }

  // PRODUCING または CLINIC_BOOKING（2回目以降のリセット後）のみ受付
  if (order.status !== "PRODUCING" && order.status !== "CLINIC_BOOKING") {
    return NextResponse.json(
      { error: "現在のステータスではクリニック予約を申し込めません" },
      { status: 400 }
    );
  }

  // 残り回数チェック
  const remaining = getRemainingSessions(order.planType, order.completedSessions);
  if (count > remaining) {
    return NextResponse.json(
      { error: `残り施術回数（${remaining}回）を超えています` },
      { status: 400 }
    );
  }

  // ステータス更新 + 施術回数を保存
  const updateData: Record<string, unknown> = {
    requestedSessionCount: count,
  };

  // PRODUCING の場合は CLINIC_BOOKING に遷移、既に CLINIC_BOOKING の場合はステータス維持
  if (order.status === "PRODUCING") {
    updateData.status = "CLINIC_BOOKING";
  }

  await prisma.cultureFluidOrder.update({
    where: { id: orderId },
    data: updateData,
  });

  // 通知送信
  const newStatus = order.status === "PRODUCING" ? "CLINIC_BOOKING" : order.status;
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
