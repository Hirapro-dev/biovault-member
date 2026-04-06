import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH: 振込先口座の更新
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  // デフォルト設定の場合、他の口座のデフォルトを解除
  if (body.isDefault) {
    await prisma.bankAccount.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const account = await prisma.bankAccount.update({
    where: { id },
    data: {
      ...(body.bankName !== undefined && { bankName: body.bankName }),
      ...(body.branchName !== undefined && { branchName: body.branchName }),
      ...(body.accountType !== undefined && { accountType: body.accountType }),
      ...(body.accountNumber !== undefined && { accountNumber: body.accountNumber }),
      ...(body.accountName !== undefined && { accountName: body.accountName }),
      ...(body.isDefault !== undefined && { isDefault: body.isDefault }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
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
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.bankAccount.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
