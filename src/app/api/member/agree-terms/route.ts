import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const now = new Date();

  // ユーザーの重要事項同意フラグを更新
  await prisma.user.update({
    where: { id: userId },
    data: {
      hasAgreedTerms: true,
      agreedTermsAt: now,
    },
  });

  // 書類のステータスを署名済みに更新（重要事項説明書 + 個人情報同意書）
  await prisma.document.updateMany({
    where: {
      userId,
      type: { in: ["CONTRACT", "PRIVACY_POLICY"] },
      status: { not: "SIGNED" },
    },
    data: {
      status: "SIGNED",
      signedAt: now,
    },
  });

  // Membershipのステータスを TERMS_AGREED に更新 + 履歴記録
  const membership = await prisma.membership.findUnique({
    where: { userId },
  });

  if (membership && membership.ipsStatus === "REGISTERED") {
    await prisma.$transaction([
      prisma.membership.update({
        where: { userId },
        data: { ipsStatus: "TERMS_AGREED" },
      }),
      prisma.statusHistory.create({
        data: {
          userId,
          fromStatus: "REGISTERED",
          toStatus: "TERMS_AGREED",
          note: "重要事項説明に同意",
          changedBy: "会員本人",
        },
      }),
    ]);
  }

  return NextResponse.json({ success: true });
}
