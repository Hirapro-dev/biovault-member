import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * 管理者用 アクセスログ取得API
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const limit = parseInt(searchParams.get("limit") || "100");

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;

  const logs = await prisma.accessLog.findMany({
    where,
    orderBy: { accessedAt: "desc" },
    take: limit,
    include: {
      user: { select: { name: true, loginId: true, email: true } },
    },
  });

  return NextResponse.json(logs);
}
