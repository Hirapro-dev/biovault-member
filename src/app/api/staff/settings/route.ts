import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// スタッフ設定取得
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "STAFF") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { email: true, loginId: true },
  });

  return NextResponse.json(user);
}

// スタッフ設定更新（メールアドレス・パスワード）
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "STAFF") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};

  // メールアドレス変更
  if (body.email) {
    const existing = await prisma.user.findFirst({
      where: { email: body.email, id: { not: userId } },
    });
    if (existing) {
      return NextResponse.json({ error: "このメールアドレスは既に使用されています" }, { status: 400 });
    }
    updateData.email = body.email;
  }

  // パスワード変更
  if (body.newPassword) {
    if (body.newPassword.length < 8) {
      return NextResponse.json({ error: "パスワードは8文字以上で入力してください" }, { status: 400 });
    }
    updateData.passwordHash = await bcrypt.hash(body.newPassword, 12);
    updateData.mustChangePassword = false;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "変更内容がありません" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  return NextResponse.json({ success: true });
}
