import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { affiliateLpUrl } from "@/lib/affiliate";
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
      user: { select: { id: true, name: true, email: true, phone: true, isIdIssued: true, lastLoginAt: true, loginId: true } },
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
    // ── 承認（PENDING → ACTIVE + 管理者指定のログインID/パスワードで発行 + メール送付） ──
    if (body.action === "approve") {
      if (profile.status === "ACTIVE") {
        return NextResponse.json({ error: "既に有効化されています" }, { status: 400 });
      }
      const loginId = (body.loginId || "").trim();
      const password = (body.password || "").trim();
      if (!loginId || !password) {
        return NextResponse.json({ error: "ログインIDとパスワードは必須です" }, { status: 400 });
      }
      // ログインIDの重複チェック（本人以外との衝突を防ぐ）
      const existing = await prisma.user.findFirst({
        where: { loginId, id: { not: profile.userId } },
        select: { id: true },
      });
      if (existing) {
        return NextResponse.json({ error: "このログインIDは既に使用されています" }, { status: 400 });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.$transaction([
        prisma.user.update({
          where: { id: profile.userId },
          data: { loginId, passwordHash, isIdIssued: true, mustChangePassword: true },
        }),
        prisma.affiliateProfile.update({
          where: { id },
          data: { status: "ACTIVE" },
        }),
      ]);
      try {
        const mail = affiliateAccountCreatedEmail(
          profile.user.name,
          loginId,
          password,
          affiliateLpUrl(profile.affiliateCode)
        );
        await sendEmail({ to: profile.user.email, ...mail });
      } catch (e) {
        console.error("Affiliate approval email failed:", e);
      }
      return NextResponse.json({ success: true, loginId });
    }

    // ── 停止 / 再開 ──
    if (body.action === "suspend" || body.action === "reactivate") {
      await prisma.affiliateProfile.update({
        where: { id },
        data: { status: body.action === "suspend" ? "SUSPENDED" : "ACTIVE" },
      });
      return NextResponse.json({ success: true });
    }

    // ── 基本情報の編集（氏名・メール・電話・活動名・チャネル・口座情報） ──
    if (body.action === "updateInfo") {
      const name = (body.name || "").trim();
      const email = (body.email || "").trim().toLowerCase();
      const phone = (body.phone || "").trim();
      if (!name || !email) {
        return NextResponse.json({ error: "氏名とメールアドレスは必須です" }, { status: 400 });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "メールアドレスの形式が正しくありません" }, { status: 400 });
      }
      const channel = body.channel === "KAWARA" ? "KAWARA" : body.channel === "NW" ? "NW" : profile.channel;
      const clean = (v: unknown, max = 100) => (typeof v === "string" ? v.trim().slice(0, max) : "") || null;

      await prisma.$transaction([
        prisma.user.update({
          where: { id: profile.userId },
          data: { name, email, phone: phone || null },
        }),
        prisma.affiliateProfile.update({
          where: { id },
          data: {
            displayName: clean(body.displayName),
            channel,
            bankName: clean(body.bankName),
            bankBranch: clean(body.bankBranch),
            bankAccountType: body.bankAccountType === "当座" ? "当座" : body.bankAccountType === "普通" ? "普通" : null,
            bankAccountNumber: clean(body.bankAccountNumber, 20),
            bankAccountName: clean(body.bankAccountName),
          },
        }),
      ]);
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

// 協力者削除（関連データも全て削除。協力者コードの確認入力が必要）
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(sessionRole(session))) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  const { id } = await params;
  const { confirmCode } = await req.json();

  const profile = await prisma.affiliateProfile.findUnique({
    where: { id },
    include: { user: { select: { id: true, role: true } } },
  });
  if (!profile) {
    return NextResponse.json({ error: "協力者が見つかりません" }, { status: 404 });
  }

  // 誤削除防止: 協力者コードの入力一致を必須にする（会員削除のログインID確認と同型）
  if (confirmCode !== profile.affiliateCode) {
    return NextResponse.json({ error: "協力者コードが一致しません" }, { status: 400 });
  }
  if (profile.user.role !== "AFFILIATE") {
    return NextResponse.json({ error: "協力者以外のアカウントは削除できません" }, { status: 400 });
  }

  try {
    // 関連データ（報酬・リード・クリック）→ プロフィール → ユーザー の順に削除
    await prisma.$transaction([
      prisma.affiliateReward.deleteMany({ where: { affiliateProfileId: profile.id } }),
      prisma.affiliateLead.deleteMany({ where: { affiliateProfileId: profile.id } }),
      prisma.affiliateClick.deleteMany({ where: { affiliateProfileId: profile.id } }),
      prisma.affiliateProfile.delete({ where: { id: profile.id } }),
      prisma.user.delete({ where: { id: profile.userId } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Affiliate delete error:", e);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
