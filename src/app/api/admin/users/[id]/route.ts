import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "OPERATOR", "VIEWER"];

// 管理者ユーザー更新（ロール変更・有効/無効切替）
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role: string }).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const currentUserId = (session.user as { id: string }).id;

  // 自分自身の降格を防止
  if (id === currentUserId) {
    return NextResponse.json({ error: "自分自身のロールは変更できません" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!targetUser || !ADMIN_ROLES.includes(targetUser.role)) {
    return NextResponse.json({ error: "対象ユーザーが見つかりません" }, { status: 404 });
  }

  const body = await req.json();
  const updateData: Record<string, unknown> = {};

  if (body.role !== undefined) {
    if (!ADMIN_ROLES.includes(body.role)) {
      return NextResponse.json({ error: "無効なロールです" }, { status: 400 });
    }
    updateData.role = body.role;
  }

  if (body.isActive !== undefined) {
    updateData.isActive = body.isActive;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "更新内容がありません" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, role: true, isActive: true },
  });

  return NextResponse.json(updated);
}

// 管理者ユーザー削除
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role: string }).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const currentUserId = (session.user as { id: string }).id;

  if (id === currentUserId) {
    return NextResponse.json({ error: "自分自身は削除できません" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!targetUser || !ADMIN_ROLES.includes(targetUser.role)) {
    return NextResponse.json({ error: "対象ユーザーが見つかりません" }, { status: 404 });
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
