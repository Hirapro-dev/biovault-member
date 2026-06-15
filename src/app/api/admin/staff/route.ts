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

  // スタッフコード採番
  //  - body.staffCode の手動指定があればそれを使用(形式・重複チェック)
  //  - 指定が無ければ「最小の空き番号」を埋める方式で採番(削除等で空いた番号も再利用)
  let staffCode: string;
  if (body.staffCode) {
    const code = String(body.staffCode).trim().toUpperCase();
    if (!/^ST-\d{3,}$/.test(code)) {
      return NextResponse.json({ error: "従業員コードは ST-0001 の形式で入力してください" }, { status: 400 });
    }
    const dup = await prisma.staff.findUnique({ where: { staffCode: code } });
    if (dup) {
      return NextResponse.json({ error: "この従業員コードは既に使用されています" }, { status: 400 });
    }
    staffCode = code;
  } else {
    const all = await prisma.staff.findMany({ select: { staffCode: true } });
    const used = new Set(
      all.map((s) => parseInt(s.staffCode.replace("ST-", ""), 10)).filter((n) => !isNaN(n))
    );
    let n = 1;
    while (used.has(n)) n++;
    staffCode = `ST-${String(n).padStart(4, "0")}`;
  }

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
