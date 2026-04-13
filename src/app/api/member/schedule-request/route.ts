import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { notifyIpsStatusChange } from "@/lib/status-notification";

/**
 * 日程調整リクエストAPI
 * 会員がマイページから「日程調整を行う」ボタンを押した際に呼ばれる。
 * - 管理者・担当従業員・担当代理店へメール通知
 * - 管理者メモに記録
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未認証です" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  // ユーザーと会員権情報を取得
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { membership: true },
  });

  if (!user || !user.membership) {
    return NextResponse.json({ error: "会員情報が見つかりません" }, { status: 400 });
  }

  // SERVICE_APPLIED ステータスの場合のみ受付
  if (user.membership.ipsStatus !== "SERVICE_APPLIED") {
    return NextResponse.json({ error: "現在のステータスでは日程調整リクエストはできません" }, { status: 400 });
  }

  // ステータスを SCHEDULE_ARRANGED に更新
  await prisma.$transaction([
    prisma.membership.update({
      where: { userId },
      data: { ipsStatus: "SCHEDULE_ARRANGED" },
    }),
    prisma.statusHistory.create({
      data: {
        userId,
        fromStatus: "SERVICE_APPLIED",
        toStatus: "SCHEDULE_ARRANGED",
        note: "細胞提供・保管同意書に同意 → 日程調整申請",
        changedBy: "会員本人",
      },
    }),
  ]);

  // 管理者メモに記録
  await prisma.adminNote.create({
    data: {
      userId: user.id,
      content: `【日程調整リクエスト】${user.name}様より日程調整の申請がありました。会員番号: ${user.membership.memberNumber}`,
      author: "システム（自動）",
    },
  });

  // 統一フォーマットで通知送信（管理者・担当従業員・担当代理店）
  try {
    await notifyIpsStatusChange({
      userId,
      memberName: user.name,
      memberNumber: user.membership.memberNumber,
      fromStatus: "SERVICE_APPLIED",
      toStatus: "SCHEDULE_ARRANGED",
      changedBy: "会員本人",
      note: "会員本人による日程調整リクエスト",
    });
  } catch (e) {
    console.error("Schedule request notification error:", e);
  }

  return NextResponse.json({ success: true });
}
