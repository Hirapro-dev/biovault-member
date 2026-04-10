import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 会員削除（関連データも全て削除）
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as { role: string }).role)) {
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

  // ── トランザクションで関連データを全て削除 ──
  // 削除済みアカウントのメールアドレスで再登録できるよう、Application/AgencyApplication
  // のレコードもこのトランザクション内で確実に削除する。
  // 旧実装ではトランザクション外 + .catch(() => {}) でエラーを握り潰していたため、
  // 削除失敗時に Application レコードが残存し、新規登録時の重複チェックで弾かれていた。
  await prisma.$transaction([
    prisma.accessLog.deleteMany({ where: { userId: id } }),
    prisma.adminNote.deleteMany({ where: { userId: id } }),
    prisma.statusHistory.deleteMany({ where: { userId: id } }),
    prisma.document.deleteMany({ where: { userId: id } }),
    prisma.favorite.deleteMany({ where: { userId: id } }),
    prisma.consentLog.deleteMany({ where: { userId: id } }),
    prisma.contentUpdateRead.deleteMany({ where: { userId: id } }),
    prisma.pushSubscription.deleteMany({ where: { userId: id } }),
    ...(user.membership
      ? [prisma.treatment.deleteMany({ where: { membershipId: user.membership.id } }),
         prisma.membership.delete({ where: { userId: id } })]
      : []),
    // 代理店プロフィール・報酬記録の削除
    prisma.agencyCommission.deleteMany({ where: { agencyProfile: { userId: id } } }),
    prisma.agencyProfile.deleteMany({ where: { userId: id } }),
    // ── 申込データの削除（メールアドレスの重複を防止） ──
    // 1) applicationId で紐付く Application レコードを deleteMany で削除
    //    （該当レコードが無くても OK な deleteMany を使う）
    ...(user.applicationId
      ? [prisma.application.deleteMany({ where: { id: user.applicationId } })]
      : []),
    // 2) メールアドレスで一致する Application レコードを全削除
    prisma.application.deleteMany({ where: { email: user.email } }),
    // 3) 代理店申込も同様
    prisma.agencyApplication.deleteMany({ where: { email: user.email } }),
    // 4) 最後に User を削除
    prisma.user.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}
