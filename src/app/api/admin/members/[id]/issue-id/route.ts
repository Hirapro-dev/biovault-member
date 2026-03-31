import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendEmail, accountCreatedEmail } from "@/lib/mail";

// ID発行（ログインID確定 + パスワード設定 + isIdIssued=true）
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const { loginId, password } = await req.json();

  if (!loginId || !password) {
    return NextResponse.json({ error: "ログインIDとパスワードは必須です" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  // ログインID重複チェック（自分以外）
  const existing = await prisma.user.findFirst({
    where: { loginId, id: { not: id } },
  });
  if (existing) {
    return NextResponse.json({ error: "このログインIDは既に使用されています" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id },
    data: {
      loginId,
      passwordHash,
      isIdIssued: true,
      mustChangePassword: true,
    },
  });

  // アカウント発行メール送信
  try {
    const emailContent = accountCreatedEmail(user.name, loginId, password);
    await sendEmail({ to: user.email, ...emailContent });
  } catch (e) {
    console.error("Account created email failed:", e);
  }

  return NextResponse.json({ success: true, loginId });
}
