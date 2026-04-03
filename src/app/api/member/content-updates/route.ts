import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * 未読コンテンツ更新通知を取得
 * GET: ログインユーザーがまだ見ていない最新の更新通知を1件返す
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未認証です" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    // 既読済みのIDリストを取得
    const readIds = (
      await prisma.contentUpdateRead.findMany({
        where: { userId },
        select: { contentUpdateId: true },
      })
    ).map((r) => r.contentUpdateId);

    // 未読のステータス変更通知を1件取得（ステータス変更時のみポップアップ表示）
    const latestUpdate = await prisma.contentUpdate.findFirst({
      where: {
        contentType: "status",
        ...(readIds.length > 0 ? { id: { notIn: readIds } } : {}),
      },
      orderBy: { publishedAt: "desc" },
    });

    return NextResponse.json({ update: latestUpdate });
  } catch {
    // テーブル未作成時は空レスポンス
    return NextResponse.json({ update: null });
  }
}

/**
 * 通知を既読にする
 * POST: { contentUpdateId: string }
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未認証です" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { contentUpdateId } = await req.json();

  if (!contentUpdateId) {
    return NextResponse.json({ error: "contentUpdateId が必要です" }, { status: 400 });
  }

  try {
    await prisma.contentUpdateRead.upsert({
      where: {
        userId_contentUpdateId: { userId, contentUpdateId },
      },
      update: {},
      create: { userId, contentUpdateId },
    });
  } catch {
    // テーブル未作成時は無視
  }

  return NextResponse.json({ success: true });
}
