import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// メールアドレスの重複チェック（フォームのリアルタイムバリデーション用）
export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ available: false, error: "メールアドレスを入力してください" });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  const existingApp = await prisma.application.findFirst({ where: { email } });

  if (existingUser || existingApp) {
    return NextResponse.json({ available: false, error: "このメールアドレスは既に登録されています" });
  }

  return NextResponse.json({ available: true });
}
