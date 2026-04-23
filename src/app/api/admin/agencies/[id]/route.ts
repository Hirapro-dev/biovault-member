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

  const updateData: Record<string, unknown> = {};
  if (body.companyName !== undefined) updateData.companyName = body.companyName || null;
  if (body.representativeName !== undefined) updateData.representativeName = body.representativeName || null;
  if (typeof body.commissionRate === "number") updateData.commissionRate = body.commissionRate;
  if (typeof body.staffCommissionRate === "number") updateData.staffCommissionRate = body.staffCommissionRate;
  if (body.bankName !== undefined) updateData.bankName = body.bankName || null;
  if (body.bankBranch !== undefined) updateData.bankBranch = body.bankBranch || null;
  if (body.bankAccountType !== undefined) updateData.bankAccountType = body.bankAccountType || null;
  if (body.bankAccountNumber !== undefined) updateData.bankAccountNumber = body.bankAccountNumber || null;
  if (body.bankAccountName !== undefined) updateData.bankAccountName = body.bankAccountName || null;

  const profile = await prisma.agencyProfile.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(profile);
}
