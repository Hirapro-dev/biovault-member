import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendEmail, accountCreatedEmail } from "@/lib/mail";

// 申込→会員登録
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const { loginId, password, nameRomaji } = await req.json();

  const application = await prisma.application.findUnique({ where: { id } });
  if (!application) {
    return NextResponse.json({ error: "申込が見つかりません" }, { status: 404 });
  }

  if (application.status === "REGISTERED") {
    return NextResponse.json({ error: "既に会員登録済みです" }, { status: 400 });
  }

  // 重複チェック
  const existingEmail = await prisma.user.findUnique({ where: { email: application.email } });
  if (existingEmail) {
    return NextResponse.json({ error: "このメールアドレスは既に登録されています" }, { status: 400 });
  }

  const existingLoginId = await prisma.user.findUnique({ where: { loginId } });
  if (existingLoginId) {
    return NextResponse.json({ error: "このログインIDは既に使用されています" }, { status: 400 });
  }

  // 会員番号の自動採番
  const lastMembership = await prisma.membership.findFirst({
    orderBy: { memberNumber: "desc" },
  });
  const nextNumber = lastMembership
    ? parseInt(lastMembership.memberNumber.replace("BV-", "")) + 1
    : 1;
  const memberNumber = `BV-${String(nextNumber).padStart(4, "0")}`;

  const passwordHash = await bcrypt.hash(password, 12);

  // トランザクション: ユーザー作成 + 申込ステータス更新
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        loginId,
        email: application.email,
        passwordHash,
        name: application.name,
        nameKana: application.nameKana,
        nameRomaji: nameRomaji || null,
        phone: application.phone,
        dateOfBirth: application.dateOfBirth,
        address: application.address,
        role: "MEMBER",
        mustChangePassword: true,
        membership: {
          create: {
            memberNumber,
            plan: "STANDARD",
            contractDate: application.applicationDate,
            totalAmount: 8800000,
            referrerName: application.referrerName,
          },
        },
      },
      include: { membership: true },
    });

    // デフォルト書類を作成
    await tx.document.createMany({
      data: [
        { userId: newUser.id, type: "CONTRACT", title: "会員契約書（細胞保管委託契約書）", status: "PENDING" },
        { userId: newUser.id, type: "CONSENT_CELL_STORAGE", title: "iPSサービス契約書", status: "PENDING" },
        { userId: newUser.id, type: "CELL_STORAGE_CONSENT", title: "細胞提供・保管同意書", status: "PENDING" },
        { userId: newUser.id, type: "INFORMED_CONSENT", title: "インフォームドコンセント", status: "PENDING" },
        { userId: newUser.id, type: "PRIVACY_POLICY", title: "個人情報取扱同意書", status: "PENDING" },
        { userId: newUser.id, type: "SIMPLE_AGREEMENT", title: "簡易規約", status: "PENDING" },
      ],
    });

    // 申込ステータスを更新
    await tx.application.update({
      where: { id },
      data: {
        status: "REGISTERED",
        convertedUserId: newUser.id,
      },
    });

    return newUser;
  });

  // アカウント発行メール送信
  try {
    const emailContent = accountCreatedEmail(application.name, loginId, password);
    await sendEmail({
      to: application.email,
      ...emailContent,
    });
  } catch (e) {
    console.error("Account created email failed:", e);
  }

  return NextResponse.json({
    user,
    loginId,
    password,
    memberNumber,
  });
}
