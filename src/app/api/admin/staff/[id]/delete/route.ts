import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 従業員アカウントを完全削除（関連データも全て削除）
// - Staff レコード
// - 紐付くログイン用 User（発行済みの場合）
// - 紹介関係のリンク（顧客・代理店の referredByStaff を null に）
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as { role: string }).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const { confirmCode } = await req.json();

  const staff = await prisma.staff.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!staff) {
    return NextResponse.json({ error: "従業員が見つかりません" }, { status: 404 });
  }

  // 従業員コード確認（誤削除防止）
  if (confirmCode !== staff.staffCode) {
    return NextResponse.json({ error: "従業員コードが一致しません" }, { status: 400 });
  }

  const userId = staff.userId;

  // ── トランザクションで関連データを全て削除 ──
  await prisma.$transaction([
    // 紹介リンクをクリア（顧客・代理店データ自体は残す）
    prisma.user.updateMany({
      where: { referredByStaff: staff.staffCode },
      data: { referredByStaff: null },
    }),
    // 報酬レコードの staffCode をクリア（履歴自体は保持）
    prisma.agencyCommission.updateMany({
      where: { staffCode: staff.staffCode },
      data: { staffCode: null },
    }),
    // ログインアカウントが発行されている場合は User 関連も削除
    ...(userId
      ? [
          prisma.accessLog.deleteMany({ where: { userId } }),
          prisma.consentLog.deleteMany({ where: { userId } }),
          prisma.contentUpdateRead.deleteMany({ where: { userId } }),
          prisma.pushSubscription.deleteMany({ where: { userId } }),
          prisma.favorite.deleteMany({ where: { userId } }),
        ]
      : []),
    // Staff レコードを削除
    prisma.staff.delete({ where: { id } }),
    // ログイン用 User を削除（発行済みの場合のみ）
    ...(userId ? [prisma.user.delete({ where: { id: userId } })] : []),
  ]);

  return NextResponse.json({ success: true });
}
