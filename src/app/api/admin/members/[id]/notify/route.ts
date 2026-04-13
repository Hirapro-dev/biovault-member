import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notifyIpsStatusChange } from "@/lib/status-notification";
import prisma from "@/lib/prisma";

/**
 * 管理者ステータス変更通知API
 *
 * dbStatus が null のステップ（契約書署名、入金確認、日程確定など）の
 * 変更時に、クライアントから直接呼び出して通知メールを送信する。
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const { stepLabel, stepKey } = await req.json();

  if (!stepLabel) {
    return NextResponse.json({ error: "ステップ名は必須です" }, { status: 400 });
  }

  const membership = await prisma.membership.findUnique({
    where: { userId: id },
    include: { user: { select: { name: true } } },
  });

  if (!membership) {
    return NextResponse.json({ error: "会員権が見つかりません" }, { status: 404 });
  }

  try {
    await notifyIpsStatusChange({
      userId: id,
      memberName: membership.user.name,
      memberNumber: membership.memberNumber,
      fromStatus: membership.ipsStatus,
      toStatus: stepKey || membership.ipsStatus,
      changedBy: session.user.name || "管理者",
      note: `管理者がステータスを「${stepLabel}」に変更`,
    });
  } catch (e) {
    console.error("Manual notification error:", e);
  }

  return NextResponse.json({ success: true });
}
