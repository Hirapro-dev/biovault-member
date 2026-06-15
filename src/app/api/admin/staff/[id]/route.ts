import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: 従業員詳細
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) {
    return NextResponse.json({ error: "従業員が見つかりません" }, { status: 404 });
  }

  return NextResponse.json(staff);
}

// PATCH: 従業員情報更新
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
  const isSuperAdmin = (session.user as { role: string }).role === "SUPER_ADMIN";

  const data: Record<string, unknown> = {
    ...(body.name !== undefined && { name: body.name }),
    ...(body.nameKana !== undefined && { nameKana: body.nameKana || null }),
    ...(body.email !== undefined && { email: body.email || null }),
    ...(body.note !== undefined && { note: body.note || null }),
    ...(body.isActive !== undefined && { isActive: body.isActive }),
  };

  // 従業員コード(staffCode)の変更は SUPER_ADMIN のみ。
  // 形式・重複チェックを行い、変更時は会員/代理店の担当従業員コード参照(referredByStaff)も追従更新する。
  if (body.staffCode !== undefined && isSuperAdmin) {
    const code = String(body.staffCode).trim().toUpperCase();
    if (!/^ST-\d{3,}$/.test(code)) {
      return NextResponse.json({ error: "従業員コードは ST-0001 の形式で入力してください" }, { status: 400 });
    }
    const current = await prisma.staff.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "従業員が見つかりません" }, { status: 404 });
    }
    if (code !== current.staffCode) {
      const dup = await prisma.staff.findFirst({ where: { staffCode: code, id: { not: id } } });
      if (dup) {
        return NextResponse.json({ error: "この従業員コードは既に使用されています" }, { status: 400 });
      }
      // 旧コードを参照している会員・代理店(User.referredByStaff)を新コードへ更新し、同時に staffCode を変更
      const [, updated] = await prisma.$transaction([
        prisma.user.updateMany({ where: { referredByStaff: current.staffCode }, data: { referredByStaff: code } }),
        prisma.staff.update({ where: { id }, data: { ...data, staffCode: code } }),
      ]);
      return NextResponse.json(updated);
    }
  }

  const staff = await prisma.staff.update({ where: { id }, data });

  return NextResponse.json(staff);
}

// DELETE: 論理削除
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.staff.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
