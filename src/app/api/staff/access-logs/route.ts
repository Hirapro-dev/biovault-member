import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// スタッフ用アクセスログ取得（担当顧客のみ）
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "STAFF") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const staffCode = (session.user as any).staffCode;
  if (!staffCode) {
    return NextResponse.json({ error: "スタッフコードが見つかりません" }, { status: 400 });
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "50");
  const pathFilter = url.searchParams.get("path") || "";

  // 担当顧客のIDリストを取得
  const customerIds = await prisma.user.findMany({
    where: { referredByStaff: staffCode, role: "MEMBER" },
    select: { id: true },
  });
  const ids = customerIds.map(c => c.id);

  if (ids.length === 0) {
    return NextResponse.json({ logs: [], total: 0, page, limit, totalPages: 0 });
  }

  const where = {
    userId: { in: ids },
    ...(pathFilter ? { path: { contains: pathFilter } } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.accessLog.findMany({
      where,
      orderBy: { accessedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { name: true, loginId: true } } },
    }),
    prisma.accessLog.count({ where }),
  ]);

  return NextResponse.json({
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
