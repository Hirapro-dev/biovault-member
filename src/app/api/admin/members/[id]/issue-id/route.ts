import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendEmail, accountCreatedEmail, agencyAccountCreatedEmail } from "@/lib/mail";
import { notifyIpsStatusChange, notifyAgencyIdIssued } from "@/lib/status-notification";
import { getAffiliateSettings, resolveRewardAmount } from "@/lib/affiliate";

// ID発行（ログインID確定 + パスワード設定 + isIdIssued=true）
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;
  const { loginId, password } = await req.json();

  if (!loginId || !password) {
    return NextResponse.json({ error: "ログインIDとパスワードは必須です" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  // 初回発行時のみ：ログインID重複時に末尾2桁連番（02〜99）を付与して衝突を回避
  // 既に発行済みのユーザーがIDを変更する場合は従来通りエラーを返す
  let finalLoginId = loginId;
  if (!user.isIdIssued) {
    const existing = await prisma.user.findFirst({
      where: { loginId: finalLoginId, id: { not: id } },
    });
    if (existing) {
      let resolved: string | null = null;
      for (let suffix = 2; suffix <= 99; suffix++) {
        const candidate = `${loginId}${String(suffix).padStart(2, "0")}`;
        const dup = await prisma.user.findFirst({
          where: { loginId: candidate, id: { not: id } },
        });
        if (!dup) { resolved = candidate; break; }
      }
      if (!resolved) {
        return NextResponse.json({ error: "ログインIDの自動採番に失敗しました（候補がすべて重複）" }, { status: 400 });
      }
      finalLoginId = resolved;
    }
  } else {
    const existing = await prisma.user.findFirst({
      where: { loginId: finalLoginId, id: { not: id } },
    });
    if (existing) {
      return NextResponse.json({ error: "このログインIDは既に使用されています" }, { status: 400 });
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.user.update({
      where: { id },
      data: {
        loginId: finalLoginId,
        passwordHash,
        isIdIssued: true,
        mustChangePassword: true,
      },
    });
  } catch (e: unknown) {
    // Prisma ユニーク制約違反
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "このログインIDは既に使用されています" }, { status: 400 });
    }
    console.error("Issue ID failed:", e);
    return NextResponse.json({ error: "ID発行に失敗しました" }, { status: 500 });
  }

  // アカウント発行メール送信（ロール別にテンプレートを切り替え）
  try {
    const scheme = user.scheme === "MRT" ? "MRT" : "SCPP";
    const emailContent = user.role === "AGENCY"
      ? agencyAccountCreatedEmail(user.name, finalLoginId, password, scheme)
      : accountCreatedEmail(user.name, finalLoginId, password, scheme);
    await sendEmail({ to: user.email, ...emailContent });
  } catch (e) {
    console.error("Account created email failed:", e);
  }

  // ご紹介協力制度: 第二報酬（本登録）の起票
  // 初回のID発行時のみ、ご紹介協力者経由の会員なら PENDING で自動起票する（確定は管理者承認）
  if (!user.isIdIssued && user.role === "MEMBER" && user.referredByAffiliate) {
    try {
      const profile = await prisma.affiliateProfile.findUnique({
        where: { affiliateCode: user.referredByAffiliate },
      });
      if (profile && profile.status === "ACTIVE") {
        const settings = await getAffiliateSettings();
        // 金額が未設定(0円)でも起票し、管理画面から金額修正・承認できるようにする
        const amount = resolveRewardAmount(profile, "CONVERSION", settings);
        const membership = await prisma.membership.findUnique({
          where: { userId: id },
          select: { memberNumber: true },
        });
        // @@unique([affiliateProfileId, rewardType, memberUserId]) により重複起票は弾かれる
        await prisma.affiliateReward.create({
          data: {
            affiliateProfileId: profile.id,
            rewardType: "CONVERSION",
            memberUserId: id,
            memberName: user.name,
            memberNumber: membership?.memberNumber || null,
            rewardAmount: amount,
            status: "PENDING",
          },
        });
      }
    } catch (e: unknown) {
      // P2002 = 既に起票済み（再発行時など）。それ以外のみログに残す
      if (!(e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002")) {
        console.error("Affiliate conversion reward failed:", e);
      }
    }
  }

  // ID発行の通知（ロール別に分岐）
  try {
    if (user.role === "AGENCY") {
      // エージェント用の通知
      const profile = await prisma.agencyProfile.findUnique({
        where: { userId: id },
        select: { agencyCode: true, companyName: true },
      });
      // 担当従業員名を取得
      let staffName: string | null = null;
      if (user.referredByStaff) {
        const staff = await prisma.staff.findUnique({
          where: { staffCode: user.referredByStaff },
          select: { name: true, staffCode: true },
        });
        staffName = staff ? `${staff.name}（${staff.staffCode}）` : null;
      }
      await notifyAgencyIdIssued({
        userId: id,
        agencyName: user.name,
        agencyCode: profile?.agencyCode || null,
        companyName: profile?.companyName || null,
        email: user.email,
        phone: user.phone,
        address: user.address,
        loginId: finalLoginId,
        changedBy: session.user.name || "管理者",
        staffName,
      });
    } else {
      // 会員用の通知（従来通り）
      const membership = await prisma.membership.findUnique({
        where: { userId: id },
        select: { memberNumber: true },
      });
      await notifyIpsStatusChange({
        userId: id,
        memberName: user.name,
        memberNumber: membership?.memberNumber,
        fromStatus: "REGISTERED",
        toStatus: "ID_ISSUED",
        changedBy: session.user.name || "管理者",
        note: `ログインID: ${finalLoginId}`,
      });
    }
  } catch (e) {
    console.error("ID issue notification failed:", e);
  }

  return NextResponse.json({ success: true, loginId: finalLoginId });
}
