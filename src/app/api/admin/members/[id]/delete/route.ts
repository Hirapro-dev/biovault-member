import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 会員削除（関連データも全て削除）
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const { confirmLoginId } = await req.json();

  const user = await prisma.user.findUnique({
    where: { id },
    include: { membership: true },
  });

  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  // ログインID確認
  if (confirmLoginId !== user.loginId) {
    return NextResponse.json({ error: "ログインIDが一致しません" }, { status: 400 });
  }

  // 管理者は削除不可
  if (user.role !== "MEMBER" && user.role !== "AGENCY") {
    return NextResponse.json({ error: "管理者アカウントは削除できません" }, { status: 400 });
  }

  // トランザクションで関連データを全て削除
  await prisma.$transaction([
    prisma.adminNote.deleteMany({ where: { userId: id } }),
    prisma.statusHistory.deleteMany({ where: { userId: id } }),
    prisma.document.deleteMany({ where: { userId: id } }),
    ...(user.membership
      ? [prisma.treatment.deleteMany({ where: { membershipId: user.membership.id } }),
         prisma.membership.delete({ where: { userId: id } })]
      : []),
    // 代理店プロフィール・報酬記録の削除
    prisma.agencyCommission.deleteMany({ where: { agencyProfile: { userId: id } } }),
    prisma.agencyProfile.deleteMany({ where: { userId: id } }),
    prisma.user.delete({ where: { id } }),
  ]);

  // 関連する申込データも削除（メールアドレスの重複を防止）
  if (user.applicationId) {
    await prisma.application.delete({ where: { id: user.applicationId } }).catch(() => {});
  }
  // メールアドレスで一致する申込データも削除
  await prisma.application.deleteMany({ where: { email: user.email } }).catch(() => {});
  await prisma.agencyApplication.deleteMany({ where: { email: user.email } }).catch(() => {});

  return NextResponse.json({ success: true });
}
