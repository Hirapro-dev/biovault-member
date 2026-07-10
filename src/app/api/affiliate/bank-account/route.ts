import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 紹介協力者本人の振込先口座の登録・更新
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const sUser = session?.user as { id?: string; role?: string } | undefined;
  if (!session?.user || sUser?.role !== "AFFILIATE" || !sUser?.id) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await req.json();
  const profile = await prisma.affiliateProfile.findUnique({ where: { userId: sUser.id } });
  if (!profile) {
    return NextResponse.json({ error: "プロフィールが見つかりません" }, { status: 404 });
  }

  const clean = (v: unknown, max = 100) => (typeof v === "string" ? v.trim().slice(0, max) : "") || null;

  await prisma.affiliateProfile.update({
    where: { id: profile.id },
    data: {
      bankName: clean(body.bankName),
      bankBranch: clean(body.bankBranch),
      bankAccountType: body.bankAccountType === "当座" ? "当座" : body.bankAccountType === "普通" ? "普通" : null,
      bankAccountNumber: clean(body.bankAccountNumber, 20),
      bankAccountName: clean(body.bankAccountName),
    },
  });

  return NextResponse.json({ success: true });
}
