import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 管理者からパスワード変更
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const { newPassword } = await req.json();

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "パスワードは8文字以上で入力してください" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id },
    data: {
      passwordHash,
      mustChangePassword: true,
    },
  });

  return NextResponse.json({ success: true });
}
