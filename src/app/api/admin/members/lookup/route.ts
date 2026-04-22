import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * 会員番号から会員情報を検索するAPI
 * 用途: 報酬追加フォームなどで memberNumber → memberName / memberUserId を自動補完
 *
 * GET /api/admin/members/lookup?memberNumber=BV-0001
 *  → { found: true, user: { id, name, memberNumber } }
 *  → { found: false } （見つからない場合）
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as { role: string }).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const memberNumber = searchParams.get("memberNumber")?.trim();

  if (!memberNumber) {
    return NextResponse.json({ error: "memberNumber が必要です" }, { status: 400 });
  }

  const membership = await prisma.membership.findUnique({
    where: { memberNumber },
    select: {
      memberNumber: true,
      user: { select: { id: true, name: true } },
    },
  });

  if (!membership) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    user: {
      id: membership.user.id,
      name: membership.user.name,
      memberNumber: membership.memberNumber,
    },
  });
}
