import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// スタッフログイン無効化
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;

  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff || !staff.userId) {
    return NextResponse.json({ error: "ログインIDが発行されていません" }, { status: 400 });
  }

  // Userを無効化し、Staffのリンクを解除
  await prisma.$transaction([
    prisma.user.update({
      where: { id: staff.userId },
      data: { isActive: false },
    }),
    prisma.staff.update({
      where: { id },
      data: { userId: null },
    }),
  ]);

  return NextResponse.json({ success: true });
}
