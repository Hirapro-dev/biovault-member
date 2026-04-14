import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// プロフィール更新
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const profile = await prisma.agencyProfile.update({
    where: { id },
    data: {
      commissionRate: body.commissionRate,
      bankName: body.bankName || null,
      bankBranch: body.bankBranch || null,
      bankAccountType: body.bankAccountType || null,
      bankAccountNumber: body.bankAccountNumber || null,
      bankAccountName: body.bankAccountName || null,
    },
  });

  return NextResponse.json(profile);
}
