import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 会員一覧取得
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const members = await prisma.user.findMany({
    where: { role: "MEMBER" },
    include: { membership: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(members);
}

// アカウント発行
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { name, nameKana, email, phone, referrerName } = await req.json();

  if (!name || !email) {
    return NextResponse.json({ error: "氏名とメールアドレスは必須です" }, { status: 400 });
  }

  // メールアドレスの重複チェック
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "このメールアドレスは既に使用されています" }, { status: 400 });
  }

  // 仮パスワード生成
  const tempPassword = generatePassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  // 会員番号の自動採番
  const lastMembership = await prisma.membership.findFirst({
    orderBy: { memberNumber: "desc" },
  });
  const nextNumber = lastMembership
    ? parseInt(lastMembership.memberNumber.replace("BV-", "")) + 1
    : 1;
  const memberNumber = `BV-${String(nextNumber).padStart(4, "0")}`;

  // トランザクションでユーザーと会員権を同時作成
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      nameKana,
      phone,
      role: "MEMBER",
      mustChangePassword: true,
      membership: {
        create: {
          memberNumber,
          plan: "STANDARD",
          contractDate: new Date(),
          totalAmount: 8800000, // 880万円
          referrerName,
        },
      },
    },
    include: { membership: true },
  });

  // デフォルト書類を作成
  const documentTypes = [
    { type: "CONTRACT" as const, title: "会員契約書（細胞保管委託契約書）" },
    { type: "CONSENT_CELL_STORAGE" as const, title: "細胞保管同意書" },
    { type: "INFORMED_CONSENT" as const, title: "インフォームドコンセント" },
    { type: "PRIVACY_POLICY" as const, title: "個人情報取扱同意書" },
    { type: "SIMPLE_AGREEMENT" as const, title: "簡易規約" },
  ];

  await prisma.document.createMany({
    data: documentTypes.map((d) => ({
      userId: user.id,
      type: d.type,
      title: d.title,
      status: "PENDING" as const,
    })),
  });

  return NextResponse.json({
    user,
    tempPassword,
    memberNumber,
  });
}

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
