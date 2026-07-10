import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { affiliateLpUrl, generatePassword } from "@/lib/affiliate";
import { sendEmail } from "@/lib/mail";
import { affiliateAccountCreatedEmail } from "@/lib/affiliate-mail";

const READ_ROLES = ["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"];
const WRITE_ROLES = ["ADMIN", "SUPER_ADMIN", "OPERATOR"];

function sessionRole(session: unknown): string {
  return ((session as { user?: { role?: string } })?.user?.role) || "";
}

// 協力者詳細
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !READ_ROLES.includes(sessionRole(session))) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  const { id } = await params;

  const profile = await prisma.affiliateProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, isIdIssued: true, lastLoginAt: true } },
      leads: { orderBy: { createdAt: "desc" } },
      rewards: { orderBy: { createdAt: "desc" } },
      _count: { select: { clicks: true } },
    },
  });
  if (!profile) {
    return NextResponse.json({ error: "協力者が見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ profile, lpUrl: affiliateLpUrl(profile.affiliateCode) });
}

// 協力者更新（承認 / 停止 / 再開 / 個別報酬額設定）
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !WRITE_ROLES.includes(sessionRole(session))) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  const profile = await prisma.affiliateProfile.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "協力者が見つかりません" }, { status: 404 });
  }

  try {
    // ── 承認（PENDING → ACTIVE + ログイン発行 + メール送付） ──
    if (body.action === "approve") {
      if (profile.status === "ACTIVE") {
        return NextResponse.json({ error: "既に有効化されています" }, { status: 400 });
      }
      const tempPassword = generatePassword();
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      await prisma.$transaction([
        prisma.user.update({
          where: { id: profile.userId },
          data: { passwordHash, isIdIssued: true, mustChangePassword: true },
        }),
        prisma.affiliateProfile.update({
          where: { id },
          data: { status: "ACTIVE" },
        }),
      ]);
      try {
        const mail = affiliateAccountCreatedEmail(
          profile.user.name,
          profile.user.loginId,
          tempPassword,
          affiliateLpUrl(profile.affiliateCode)
        );
        await sendEmail({ to: profile.user.email, ...mail });
      } catch (e) {
        console.error("Affiliate approval email failed:", e);
      }
      return NextResponse.json({ success: true });
    }

    // ── 停止 / 再開 ──
    if (body.action === "suspend" || body.action === "reactivate") {
      await prisma.affiliateProfile.update({
        where: { id },
        data: { status: body.action === "suspend" ? "SUSPENDED" : "ACTIVE" },
      });
      return NextResponse.json({ success: true });
    }

    // ── 個別報酬額の設定（null でチャネル既定に戻す） ──
    if (body.action === "setRewards") {
      const parse = (v: unknown) => {
        if (v === null || v === "" || v === undefined) return null;
        const n = parseInt(String(v), 10);
        return Number.isFinite(n) && n >= 0 ? n : null;
      };
      await prisma.affiliateProfile.update({
        where: { id },
        data: {
          rewardAmountLead: parse(body.rewardAmountLead),
          rewardAmountConversion: parse(body.rewardAmountConversion),
        },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "不明な操作です" }, { status: 400 });
  } catch (e) {
    console.error("Affiliate update error:", e);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
