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

  // 未読の最新通知を1件取得
  const latestUpdate = await prisma.contentUpdate.findFirst({
    where: {
      NOT: {
        id: {
          in: (
            await prisma.contentUpdateRead.findMany({
              where: { userId },
              select: { contentUpdateId: true },
            })
          ).map((r) => r.contentUpdateId),
        },
      },
    },
    orderBy: { publishedAt: "desc" },
  });

  return NextResponse.json({ update: latestUpdate });
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

  // 既読レコードを作成（重複は無視）
  await prisma.contentUpdateRead.upsert({
    where: {
      userId_contentUpdateId: { userId, contentUpdateId },
    },
    update: {},
    create: { userId, contentUpdateId },
  });

  return NextResponse.json({ success: true });
}
