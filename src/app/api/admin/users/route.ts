import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendEmail, adminAccountCreatedEmail } from "@/lib/mail";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "OPERATOR", "VIEWER"];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "全権限者",
  ADMIN: "管理者",
  OPERATOR: "処理者",
  VIEWER: "閲覧者",
};

// 管理者ユーザー一覧取得
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role: string }).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { role: { in: ADMIN_ROLES as ("SUPER_ADMIN" | "ADMIN" | "OPERATOR" | "VIEWER")[] } },
    select: {
      id: true,
      name: true,
      email: true,
      loginId: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

// 管理者ユーザー追加
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role: string }).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { name, email, loginId, password, role } = await req.json();

  if (!name || !email || !loginId || !password || !role) {
    return NextResponse.json({ error: "必須項目が入力されていません" }, { status: 400 });
  }

  if (!ADMIN_ROLES.includes(role)) {
    return NextResponse.json({ error: "無効なロールです" }, { status: 400 });
  }

  // 重複チェック
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return NextResponse.json({ error: "このメールアドレスは既に使用されています" }, { status: 400 });
  }

  const existingLoginId = await prisma.user.findUnique({ where: { loginId } });
  if (existingLoginId) {
    return NextResponse.json({ error: "このログインIDは既に使用されています" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      loginId,
      passwordHash,
      role: role as "SUPER_ADMIN" | "ADMIN" | "OPERATOR" | "VIEWER",
      isActive: true,
      isIdIssued: true,
      mustChangePassword: true,
    },
  });

  // アカウント発行メール送信（平文パスワードはこのタイミングでしか扱えないため）
  let emailSent = false;
  try {
    const roleLabel = ROLE_LABELS[user.role] || user.role;
    const { subject, bodyText, bodyHtml } = adminAccountCreatedEmail(
      user.name,
      user.loginId,
      password,
      roleLabel
    );
    const result = await sendEmail({
      to: user.email,
      subject,
      bodyText,
      bodyHtml,
    });
    emailSent = result.success;
  } catch (err) {
    console.error("adminAccountCreatedEmail failed:", err);
  }

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    loginId: user.loginId,
    role: user.role,
    emailSent,
  });
}
