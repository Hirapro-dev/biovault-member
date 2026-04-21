import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendEmail, staffAccountCreatedEmail } from "@/lib/mail";

// スタッフログインID発行
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as { role: string }).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const { loginId, password } = await req.json();

  if (!loginId || !password) {
    return NextResponse.json({ error: "ログインIDとパスワードは必須です" }, { status: 400 });
  }

  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) {
    return NextResponse.json({ error: "従業員が見つかりません" }, { status: 404 });
  }
  if (staff.userId) {
    return NextResponse.json({ error: "既にログインIDが発行されています" }, { status: 400 });
  }

  // loginId重複チェック
  const existingLogin = await prisma.user.findFirst({ where: { loginId } });
  if (existingLogin) {
    return NextResponse.json({ error: "このログインIDは既に使用されています" }, { status: 400 });
  }

  // メールアドレス（Staffのemailが他のUserと重複する可能性があるため、
  // まずStaffのemailで試行し、重複している場合は内部用アドレスを使用）
  let emailToUse = staff.email || `${loginId}@staff.biovault.internal`;
  const existingEmail = await prisma.user.findFirst({ where: { email: emailToUse } });
  if (existingEmail) {
    // Staffのメールが既に別のUserで使われている場合、内部用アドレスにフォールバック
    emailToUse = `${staff.staffCode.toLowerCase()}@staff.biovault.internal`;
    const existingFallback = await prisma.user.findFirst({ where: { email: emailToUse } });
    if (existingFallback) {
      return NextResponse.json({ error: "このメールアドレスは既に使用されています" }, { status: 400 });
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // トランザクションでUser作成 + Staff紐付け
  const user = await prisma.user.create({
    data: {
      loginId,
      email: emailToUse,
      passwordHash,
      role: "STAFF",
      name: staff.name,
      nameKana: staff.nameKana,
      isActive: true,
      isIdIssued: true,
      mustChangePassword: true,
    },
  });

  await prisma.staff.update({
    where: { id },
    data: { userId: user.id },
  });

  // アカウント発行メール送信（Staffマスタにメールが登録されている場合のみ）
  let emailSent = false;
  if (staff.email) {
    try {
      const { subject, bodyText, bodyHtml } = staffAccountCreatedEmail(
        staff.name,
        loginId,
        password
      );
      const result = await sendEmail({
        to: staff.email,
        subject,
        bodyText,
        bodyHtml,
      });
      emailSent = result.success;
    } catch (err) {
      console.error("staffAccountCreatedEmail failed:", err);
    }
  }

  return NextResponse.json({ success: true, loginId, emailSent });
}
