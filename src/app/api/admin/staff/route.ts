import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: 従業員一覧（担当数・売上付き）
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const staffList = await prisma.staff.findMany({
    orderBy: { createdAt: "desc" },
  });

  // 各スタッフの担当顧客数と売上を集計
  const results = await Promise.all(
    staffList.map(async (s) => {
      const customers = await prisma.user.findMany({
        where: { referredByStaff: s.staffCode, role: "MEMBER" },
        select: { id: true, membership: { select: { paidAmount: true, totalAmount: true } } },
      });
      const customerCount = customers.length;
      const paidAmount = customers.reduce((sum, c) => sum + (c.membership?.paidAmount || 0), 0);
      return { ...s, customerCount, paidAmount };
    })
  );

  return NextResponse.json(results);
}

// POST: 従業員新規作成
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await req.json();
  if (!body.name) {
    return NextResponse.json({ error: "氏名は必須です" }, { status: 400 });
  }

  // スタッフコード自動採番
  const lastStaff = await prisma.staff.findFirst({
    orderBy: { staffCode: "desc" },
  });
  const nextNumber = lastStaff
    ? parseInt(lastStaff.staffCode.replace("ST-", "")) + 1
    : 1;
  const staffCode = `ST-${String(nextNumber).padStart(4, "0")}`;

  const staff = await prisma.staff.create({
    data: {
      staffCode,
      name: body.name,
      nameKana: body.nameKana || null,
      email: body.email || null,
      note: body.note || null,
    },
  });

  return NextResponse.json(staff);
}
