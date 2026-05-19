import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { normalizeScheme } from "@/lib/scheme";

// PATCH: 振込先口座の更新
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const account = await prisma.bankAccount.update({
    where: { id },
    data: {
      ...(body.bankName !== undefined && { bankName: body.bankName }),
      ...(body.branchName !== undefined && { branchName: body.branchName }),
      ...(body.accountType !== undefined && { accountType: body.accountType }),
      ...(body.accountNumber !== undefined && { accountNumber: body.accountNumber }),
      ...(body.accountName !== undefined && { accountName: body.accountName }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.scheme !== undefined && { scheme: normalizeScheme(body.scheme) }),
    },
  });

  return NextResponse.json(account);
}

// DELETE: 振込先口座の無効化（論理削除）
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.bankAccount.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
