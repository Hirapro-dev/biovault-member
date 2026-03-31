import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// 報酬追加
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const commission = await prisma.agencyCommission.create({
    data: {
      agencyProfileId: id,
      memberUserId: body.memberUserId,
      memberName: body.memberName,
      memberNumber: body.memberNumber,
      saleAmount: body.saleAmount,
      commissionRate: body.commissionRate,
      commissionAmount: body.commissionAmount,
      contributionType: body.contributionType,
      status: body.status || "PENDING",
    },
  });

  return NextResponse.json(commission);
}
