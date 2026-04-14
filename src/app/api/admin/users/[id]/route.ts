import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "OPERATOR", "VIEWER"];

// 管理者ユーザー更新（ロール変更・有効/無効切替・メール変更・パスワード変更）
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { id } = await params;
  const currentUserId = (session.user as { id: string }).id;
  const currentRole = (session.user as { role: string }).role;
  const isSuperAdmin = currentRole === "SUPER_ADMIN";
  const isSelf = id === currentUserId;

  // SUPER_ADMINは全員を編集可能、それ以外は自分自身のみ
  if (!isSuperAdmin && !isSelf) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  // 管理者ロールのユーザーのみ対象
  const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true, email: true } });
  if (!targetUser || !ADMIN_ROLES.includes(targetUser.role)) {
    return NextResponse.json({ error: "対象ユーザーが見つかりません" }, { status: 404 });
  }

  const body = await req.json();
  const updateData: Record<string, unknown> = {};

  // ロール変更（SUPER_ADMINのみ、自分自身は不可）
  if (body.role !== undefined) {
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "ロール変更の権限がありません" }, { status: 403 });
    }
    if (isSelf) {
      return NextResponse.json({ error: "自分自身のロールは変更できません" }, { status: 400 });
    }
    if (!ADMIN_ROLES.includes(body.role)) {
      return NextResponse.json({ error: "無効なロールです" }, { status: 400 });
    }
    updateData.role = body.role;
  }

  // 有効/無効切替（SUPER_ADMINのみ、自分自身は不可）
  if (body.isActive !== undefined) {
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "アカウント有効/無効切替の権限がありません" }, { status: 403 });
    }
    if (isSelf) {
      return NextResponse.json({ error: "自分自身を無効化できません" }, { status: 400 });
    }
    updateData.isActive = body.isActive;
  }

  // 名前変更
  if (body.name !== undefined && body.name.trim()) {
    updateData.name = body.name.trim();
  }

  // メールアドレス変更
  if (body.email !== undefined && body.email.trim()) {
    const newEmail = body.email.trim().toLowerCase();
    if (newEmail !== targetUser.email) {
      const existing = await prisma.user.findUnique({ where: { email: newEmail } });
      if (existing) {
        return NextResponse.json({ error: "このメールアドレスは既に使用されています" }, { status: 400 });
      }
      updateData.email = newEmail;
    }
  }

  // パスワード変更
  if (body.newPassword !== undefined && body.newPassword) {
    if (body.newPassword.length < 6) {
      return NextResponse.json({ error: "パスワードは6文字以上で入力してください" }, { status: 400 });
    }
    updateData.passwordHash = await bcrypt.hash(body.newPassword, 12);
    // 自分自身のパスワード変更時はmustChangePasswordをfalseに
    if (isSelf) {
      updateData.mustChangePassword = false;
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "更新内容がありません" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  return NextResponse.json(updated);
}

// 管理者ユーザー削除（SUPER_ADMINのみ）
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
