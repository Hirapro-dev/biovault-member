import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * 代理店ユーザー基本情報の更新（管理者用）
 * PATCH /api/admin/agencies/[id]/user-info
 * id は User.id（= AgencyProfile.userId）
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR"].includes((session.user as { role: string }).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  // 対象が代理店ロールであることを確認
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true, email: true } });
  if (!target || target.role !== "AGENCY") {
    return NextResponse.json({ error: "対象ユーザーが見つかりません" }, { status: 404 });
  }

  // メール変更時は重複チェック
  if (body.email && body.email !== target.email) {
    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) {
      return NextResponse.json({ error: "このメールアドレスは既に使用されています" }, { status: 400 });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.nameKana !== undefined) updateData.nameKana = body.nameKana || null;
  if (body.email !== undefined) updateData.email = body.email;
  if (body.phone !== undefined) updateData.phone = body.phone || null;
  if (body.address !== undefined) updateData.address = body.address || null;

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ success: true, user: updated });
}
