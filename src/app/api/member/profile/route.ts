import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// プロフィール更新（会員自身）
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();

  // 更新可能なフィールドのみ許可
  const allowedFields: Record<string, unknown> = {};

  if (body.email !== undefined) {
    // メールの重複チェック
    const existing = await prisma.user.findFirst({
      where: { email: body.email, id: { not: userId } },
    });
    if (existing) {
      return NextResponse.json({ error: "このメールアドレスは既に使用されています" }, { status: 400 });
    }
    allowedFields.email = body.email;
  }

  if (body.phone !== undefined) {
    allowedFields.phone = body.phone || null;
  }

  if (body.dateOfBirth !== undefined) {
    allowedFields.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  }

  if (body.address !== undefined) {
    allowedFields.address = body.address || null;
  }

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json({ error: "更新する項目がありません" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: allowedFields,
  });

  return NextResponse.json({ success: true, user });
}
