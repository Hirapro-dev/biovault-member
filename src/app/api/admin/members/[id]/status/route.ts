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

  // サービス申込済みの場合
  if (newStatus === "SERVICE_APPLIED" && !membership.serviceAppliedAt) {
    updateData.serviceAppliedAt = new Date();
  }

  // トランザクション: ステータス更新 + 履歴記録
  const transactionOps = [
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

  return NextResponse.json({ success: true });
}
