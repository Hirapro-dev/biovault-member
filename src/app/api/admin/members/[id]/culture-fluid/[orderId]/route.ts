import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getTotalSessions } from "@/lib/culture-fluid-plans";
import { notifyCultureFluidStatusChange } from "@/lib/status-notification";

// 培養上清液注文ステータス更新
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; orderId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as { role: string }).role)) {
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
      // 管理者が入金日を指定した場合はそれを使い、指定がなければ現在日時
      updateData.paidAt = body.paidAt ? new Date(body.paidAt) : new Date();
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

  // 施術完了日 → 指定された日付を completedAt に保存
  // actualSessions: 実際に施術した回数（デフォルト: requestedSessionCount or 1）
  // 残り回数がある場合は次の施術サイクルのためにフェーズ2（施術工程）をリセット
  if (body.completedAt) {
    const actualSessions = Number(body.actualSessions) || order.requestedSessionCount || 1;
    const totalSessions = getTotalSessions(order.planType);
    const completedDate = new Date(body.completedAt);

    // 実際の施術回数分を加算（上限: 残り回数）
    const remaining = totalSessions - order.completedSessions;
    const sessionsToAdd = Math.min(actualSessions, remaining);
    const newCompletedSessions = order.completedSessions + sessionsToAdd;

    updateData.completedAt = completedDate;
    updateData.completedSessions = newCompletedSessions;

    // sessionDates に施術完了日を追記（実施回数分）
    const existingDates: string[] = order.sessionDates
      ? JSON.parse(order.sessionDates as string)
      : [];
    for (let i = 0; i < sessionsToAdd; i++) {
      existingDates.push(completedDate.toISOString().split("T")[0]);
    }
    updateData.sessionDates = JSON.stringify(existingDates);

    if (newCompletedSessions >= totalSessions) {
      // 全回数完了 → COMPLETED で固定
      updateData.status = "COMPLETED";
    } else {
      // 残り回数あり → CLINIC_BOOKING にリセットして施術フェーズから再スタート
      // フェーズ1（保管まで）は維持し、フェーズ2（施術まで）のみリセット
      updateData.status = "CLINIC_BOOKING";
      updateData.clinicDate = null;
      updateData.clinicName = null;
      updateData.clinicAddress = null;
      updateData.clinicPhone = null;
      updateData.informedAgreedAt = null;
    }
  }

  // 「次の予約をする」アクション（管理者が明示的に次の施術サイクルを開始）
  if (body.action === "next_session") {
    if (order.completedSessions >= getTotalSessions(order.planType)) {
      return NextResponse.json({ error: "残り施術回数がありません" }, { status: 400 });
    }
    updateData.status = "CLINIC_BOOKING";
    updateData.clinicDate = null;
    updateData.clinicName = null;
    updateData.clinicAddress = null;
    updateData.clinicPhone = null;
    updateData.informedAgreedAt = null;
    updateData.completedAt = null;
  }

  const updated = await prisma.cultureFluidOrder.update({
    where: { id: orderId },
    data: updateData,
  });

  // ステータスが変更された場合に通知
  if (updated.status !== order.status) {
    try {
      const member = await prisma.user.findUnique({
        where: { id },
        select: { name: true, membership: { select: { memberNumber: true } } },
      });
      if (member) {
        await notifyCultureFluidStatusChange({
          userId: id,
          memberName: member.name,
          memberNumber: member.membership?.memberNumber,
          planLabel: order.planLabel,
          fromStatus: order.status,
          toStatus: updated.status,
          changedBy: session.user.name || "管理者",
        });
      }
    } catch (e) {
      console.error("Culture fluid notification error:", e);
    }
  }

  return NextResponse.json(updated);
}
