import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * 管理者用 アクセスログ取得API
 * クエリパラメータ:
 *   userId   - 特定ユーザーで絞り込み
 *   from     - 開始日（ISO文字列）
 *   to       - 終了日（ISO文字列）
 *   path     - パスの部分一致検索
 *   page     - ページ番号（1始まり、デフォルト1）
 *   limit    - 1ページあたり件数（デフォルト50）
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const pathFilter = searchParams.get("path");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50")));

  // デフォルト: 直近7日間
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 7);
  defaultFrom.setHours(0, 0, 0, 0);

  const dateFrom = from ? new Date(from) : defaultFrom;
  const dateTo = to ? new Date(to) : now;

  // フィルタ構築
  const where: Record<string, unknown> = {
    accessedAt: {
      gte: dateFrom,
      lte: dateTo,
    },
  };
  if (userId) where.userId = userId;
  if (pathFilter) where.path = { contains: pathFilter };

  // 総件数を取得（ページネーション用）
  const total = await prisma.accessLog.count({ where });

  const logs = await prisma.accessLog.findMany({
    where,
    orderBy: { accessedAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      user: { select: { name: true, loginId: true, email: true } },
    },
  });

  return NextResponse.json({
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
