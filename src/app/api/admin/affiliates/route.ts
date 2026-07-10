import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const READ_ROLES = ["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"];

// ご紹介協力者一覧（クリック数・リード数・成約数・報酬累計付き）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !READ_ROLES.includes((session.user as { role?: string }).role || "")) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const profiles = await prisma.affiliateProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, isIdIssued: true, loginId: true } },
      _count: { select: { clicks: true, leads: true } },
    },
  });

  // 成約数（第二報酬の起票数）と報酬集計
  const rewards = await prisma.affiliateReward.groupBy({
    by: ["affiliateProfileId", "rewardType", "status"],
    _count: { _all: true },
    _sum: { rewardAmount: true },
  });

  const result = profiles.map((p) => {
    const mine = rewards.filter((r) => r.affiliateProfileId === p.id);
    const conversions = mine
      .filter((r) => r.rewardType === "CONVERSION" && r.status !== "CANCELLED")
      .reduce((s, r) => s + r._count._all, 0);
    const totalConfirmed = mine
      .filter((r) => r.status === "CONFIRMED" || r.status === "PAID")
      .reduce((s, r) => s + (r._sum.rewardAmount || 0), 0);
    const totalPending = mine
      .filter((r) => r.status === "PENDING")
      .reduce((s, r) => s + (r._sum.rewardAmount || 0), 0);
    return {
      id: p.id,
      affiliateCode: p.affiliateCode,
      channel: p.channel,
      status: p.status,
      displayName: p.displayName,
      name: p.user.name,
      email: p.user.email,
      phone: p.user.phone,
      loginId: p.user.loginId,
      userId: p.user.id,
      clicks: p._count.clicks,
      leads: p._count.leads,
      conversions,
      totalConfirmed,
      totalPending,
      createdAt: p.createdAt,
    };
  });

  return NextResponse.json({ affiliates: result });
}
