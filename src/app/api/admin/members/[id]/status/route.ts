import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendPushToAll } from "@/lib/push-notification";
import type { IpsStatus } from "@prisma/client";

// ステータスの日本語ラベル（通知用）
const STATUS_LABELS: Record<string, string> = {
  REGISTERED: "メンバーシップ登録",
  TERMS_AGREED: "iPS細胞作製適合確認",
  SERVICE_APPLIED: "サービス申込",
  SCHEDULE_ARRANGED: "iPS細胞作製におけるクリニックの日程調整",
  BLOOD_COLLECTED: "問診・採血",
  IPS_CREATING: "iPS細胞 作製中",
  STORAGE_ACTIVE: "iPS細胞 保管中",
};

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

  // ── 会員への通知 ──
  const statusLabel = STATUS_LABELS[newStatus] || newStatus;
  const notificationTitle = `ステータスが「${statusLabel}」に更新されました`;

  // ContentUpdate（ログイン時ポップアップ用）を作成
  await prisma.contentUpdate.create({
    data: {
      title: notificationTitle,
      contentType: "status",
      contentId: id,
      linkUrl: "/mypage",
    },
  });

  // 該当ユーザーのPush Subscriptionにのみ通知送信
  const userSubscriptions = await prisma.pushSubscription.findMany({
    where: { userId: id },
  });

  if (userSubscriptions.length > 0) {
    const webpush = await import("web-push");
    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
    const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
    const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:info@biovault.jp";

    if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

      const payload = JSON.stringify({
        title: "BioVault - ステータス更新",
        body: notificationTitle,
        url: "/mypage",
      });

      for (const sub of userSubscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
        } catch (error: unknown) {
          // 410 Gone = サブスクリプションが無効 → 削除
          if (error && typeof error === "object" && "statusCode" in error && (error as { statusCode: number }).statusCode === 410) {
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          }
        }
      }
    }
  }

  return NextResponse.json({ success: true });
}
