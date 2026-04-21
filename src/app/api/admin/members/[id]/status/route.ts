import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { IpsStatus, Prisma } from "@prisma/client";
import { notifyIpsStatusChange } from "@/lib/status-notification";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const { newStatus, note, date } = await req.json();

  if (!newStatus || !note) {
    return NextResponse.json({ error: "ステータスと変更理由は必須です" }, { status: 400 });
  }

  const membership = await prisma.membership.findUnique({
    where: { userId: id },
    include: { user: { select: { name: true } } },
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

  // 問診・採血の場合は clinicDate を設定し、7日後にiPS作製開始も自動設定
  if (newStatus === "BLOOD_COLLECTED") {
    updateData.clinicDate = membership.clinicDate || specifiedDate;
    // 7日後をiPS作製開始日として自動設定
    const ipsStartDate = new Date(specifiedDate);
    ipsStartDate.setDate(ipsStartDate.getDate() + 7);
    updateData.ipsStatus = "IPS_CREATING" as IpsStatus;
    updateData.ipsCompletedAt = ipsStartDate;
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

  // サービス申込済みの場合（880万円入金確認）
  if (newStatus === "SERVICE_APPLIED") {
    if (!membership.serviceAppliedAt) {
      updateData.serviceAppliedAt = new Date();
    }
  }

  // トランザクション: ステータス更新 + 履歴記録
  const transactionOps: Prisma.PrismaPromise<unknown>[] = [
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
  ];

  // 問診・採血の場合、IPS_CREATINGの履歴も自動追加
  if (newStatus === "BLOOD_COLLECTED") {
    const ipsStartDate = new Date(specifiedDate);
    ipsStartDate.setDate(ipsStartDate.getDate() + 7);
    transactionOps.push(
      prisma.statusHistory.create({
        data: {
          userId: id,
          fromStatus: "BLOOD_COLLECTED" as IpsStatus,
          toStatus: "IPS_CREATING" as IpsStatus,
          note: `問診・採血日の7日後（${ipsStartDate.toISOString().split("T")[0]}）を作製開始日として自動設定`,
          changedBy: session.user.name || "管理者",
        },
      })
    );
  }

  // iPSサービス付属の培養上清液点滴1回分は、入金完了時に別途作成する
  // （このAPIではステータス変更のみ）

  // STORAGE_ACTIVE: 付属の培養上清液の精製を開始
  // 保管開始日を起点に1ヶ月後を精製完了日、精製完了日+8ヶ月を管理期限として設定
  if (newStatus === "STORAGE_ACTIVE") {
    const includedOrder = await prisma.cultureFluidOrder.findFirst({
      where: { userId: id, planType: "iv_drip_1_included" },
    });

    if (includedOrder && !includedOrder.producedAt) {
      const producedAt = new Date(specifiedDate);
      producedAt.setMonth(producedAt.getMonth() + 1);
      const expiresAt = new Date(producedAt);
      expiresAt.setMonth(expiresAt.getMonth() + 8);

      transactionOps.push(
        prisma.cultureFluidOrder.update({
          where: { id: includedOrder.id },
          data: {
            status: "PAYMENT_CONFIRMED",
            producedAt,
            expiresAt,
          },
        })
      );
    }
  }

  await prisma.$transaction(transactionOps);

  // SERVICE_APPLIED以降のステータスになった場合、iPSサービス利用規約を同意済みに更新
  const appliedStatuses = ["SERVICE_APPLIED", "SCHEDULE_ARRANGED", "BLOOD_COLLECTED", "IPS_CREATING", "STORAGE_ACTIVE"];
  const finalStatus = newStatus === "BLOOD_COLLECTED" ? "IPS_CREATING" : newStatus;
  if (appliedStatuses.includes(finalStatus)) {
    await prisma.document.updateMany({
      where: { userId: id, type: "SERVICE_TERMS", status: "PENDING" },
      data: { status: "SIGNED", signedAt: new Date() },
    });
  }

  // ステータス変更通知を送信
  try {
    await notifyIpsStatusChange({
      userId: id,
      memberName: membership.user.name,
      memberNumber: membership.memberNumber,
      fromStatus,
      toStatus: finalStatus,
      changedBy: session.user.name || "管理者",
      note,
    });
  } catch (e) {
    console.error("iPS status notification error:", e);
  }

  return NextResponse.json({ success: true });
}
