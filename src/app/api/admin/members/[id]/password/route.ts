import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const TESTER_EMAILS = (process.env.TESTER_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

// 管理者からパスワード変更
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const { newPassword } = await req.json();

  // 対象ユーザーがテスターか判定
  const targetUser = await prisma.user.findUnique({ where: { id }, select: { email: true } });
  const isTester = targetUser ? TESTER_EMAILS.includes(targetUser.email.toLowerCase()) : false;

  // テスターは短いパスワードも許可、通常は8文字以上必須
  const minLength = isTester ? 1 : 8;
  if (!newPassword || newPassword.length < minLength) {
    return NextResponse.json({ error: "パスワードは8文字以上で入力してください" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id },
    data: {
      passwordHash,
      mustChangePassword: !isTester,
    },
  });

  return NextResponse.json({ success: true });
}
