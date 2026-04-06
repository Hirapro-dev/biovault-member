import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { IpsStatus } from "@prisma/client";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const { newStatus, note, date } = await req.json();

  if (!newStatus || !note) {
    return NextResponse.json({ error: "ステータスと変更理由は必須です" }, { status: 400 });
  }

  const membership = await prisma.membership.findUnique({
    where: { userId: id },
  });

  if (!membership) {
    return NextResponse.json({ error: "会員権が見つかりません" }, { status: 404 });
  }

  const fromStatus = membership.ipsStatus;

  // ステータス更新データ
  const updateData: Record<string, unknown> = {
    ipsStatus: newStatus as IpsStatus,
  };

  // 日付指定がある場合はそれを使用
  const specifiedDate = date ? new Date(date) : new Date();

  // 問診・採血の場合は clinicDate を設定
  if (newStatus === "BLOOD_COLLECTED") {
    updateData.clinicDate = membership.clinicDate || specifiedDate;
  }

  // iPS作製中の場合は ipsCompletedAt を作製開始日として設定
  if (newStatus === "IPS_CREATING") {
    updateData.ipsCompletedAt = specifiedDate;
  }

  // 保管中になった場合は保管開始日を設定
  if (newStatus === "STORAGE_ACTIVE") {
    updateData.storageStartAt = specifiedDate;
    if (!membership.ipsCompletedAt) {
      updateData.ipsCompletedAt = specifiedDate;
    }
  }

  // サービス申込済みの場合
  if (newStatus === "SERVICE_APPLIED" && !membership.serviceAppliedAt) {
    updateData.serviceAppliedAt = new Date();
  }

  // トランザクション: ステータス更新 + 履歴記録
  await prisma.$transaction([
    prisma.membership.update({
      where: { userId: id },
      data: updateData,
    }),
    prisma.statusHistory.create({
      data: {
        userId: id,
        fromStatus,
        toStatus: newStatus as IpsStatus,
        note,
        changedBy: session.user.name || "管理者",
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
