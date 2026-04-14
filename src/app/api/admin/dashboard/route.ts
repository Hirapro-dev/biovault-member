import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const [
    totalMembers,
    ipsCreating,
    paymentCompleted,
    recentLogs,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.membership.count({ where: { ipsStatus: "IPS_CREATING" } }),
    prisma.membership.count({ where: { paymentStatus: "COMPLETED" } }),
    prisma.statusHistory.findMany({
      take: 10,
      orderBy: { changedAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
  ]);

  // 今月の新規
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const newThisMonth = await prisma.user.count({
    where: { role: "MEMBER", createdAt: { gte: startOfMonth } },
  });

  return NextResponse.json({
    totalMembers,
    ipsCreating,
    paymentCompleted,
    newThisMonth,
    recentLogs,
  });
}
