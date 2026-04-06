import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 書類設定を取得（認証必須）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  // doc_ プレフィックスの設定をすべて取得
  const settings = await prisma.siteSetting.findMany({
    where: { key: { startsWith: "doc_" } },
  });

  // キーをマップに変換
  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    settingsMap[s.key] = s.content;
  }

  return NextResponse.json(settingsMap);
}
