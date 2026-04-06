import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: 振込先口座一覧
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const accounts = await prisma.bankAccount.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(accounts);
}

// POST: 振込先口座の新規作成
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await req.json();

  if (!body.bankName || !body.branchName || !body.accountType || !body.accountNumber || !body.accountName) {
    return NextResponse.json({ error: "銀行名・支店名・口座種別・口座番号・口座名義は必須です" }, { status: 400 });
  }

  // デフォルト設定の場合、他の口座のデフォルトを解除
  if (body.isDefault) {
    await prisma.bankAccount.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  const account = await prisma.bankAccount.create({
    data: {
      bankName: body.bankName,
      branchName: body.branchName,
      accountType: body.accountType,
      accountNumber: body.accountNumber,
      accountName: body.accountName,
      isDefault: body.isDefault || false,
    },
  });

  return NextResponse.json(account);
}
