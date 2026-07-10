import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mail";
import { affiliateRewardConfirmedEmail } from "@/lib/affiliate-mail";
import { AFFILIATE_REWARD_TYPE_LABELS } from "@/lib/affiliate-labels";

const READ_ROLES = ["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"];
const WRITE_ROLES = ["ADMIN", "SUPER_ADMIN", "OPERATOR"];

// 報酬一覧
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !READ_ROLES.includes((session.user as { role?: string }).role || "")) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const rewards = await prisma.affiliateReward.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      affiliateProfile: {
        select: {
          affiliateCode: true,
          channel: true,
          displayName: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });
  return NextResponse.json({ rewards });
}

// 報酬ステータス更新（承認 / 支払済 / 却下 / 承認待ちに戻す）
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !WRITE_ROLES.includes((session.user as { role?: string }).role || "")) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  const body = await req.json();
  const { id, action } = body as { id?: string; action?: string };
  if (!id || !action) {
    return NextResponse.json({ error: "パラメータが不足しています" }, { status: 400 });
  }

  const reward = await prisma.affiliateReward.findUnique({
    where: { id },
    include: {
      affiliateProfile: { select: { user: { select: { name: true, email: true } } } },
    },
  });
  if (!reward) {
    return NextResponse.json({ error: "報酬レコードが見つかりません" }, { status: 404 });
  }

  try {
    if (action === "confirm") {
      // 承認 → 協力者へ確定通知メール
      await prisma.affiliateReward.update({ where: { id }, data: { status: "CONFIRMED" } });
      try {
        const mail = affiliateRewardConfirmedEmail(
          reward.affiliateProfile.user.name,
          AFFILIATE_REWARD_TYPE_LABELS[reward.rewardType] || reward.rewardType,
          reward.rewardAmount
        );
        await sendEmail({ to: reward.affiliateProfile.user.email, ...mail });
      } catch (e) {
        console.error("Reward confirmed email failed:", e);
      }
      return NextResponse.json({ success: true });
    }
    if (action === "pay") {
      await prisma.affiliateReward.update({
        where: { id },
        data: { status: "PAID", paidAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }
    if (action === "cancel") {
      await prisma.affiliateReward.update({
        where: { id },
        data: { status: "CANCELLED", note: body.note ? String(body.note) : reward.note },
      });
      return NextResponse.json({ success: true });
    }
    if (action === "revert") {
      await prisma.affiliateReward.update({
        where: { id },
        data: { status: "PENDING", paidAt: null },
      });
      return NextResponse.json({ success: true });
    }
    if (action === "setAmount") {
      // 金額修正は承認待ちの間のみ可能（確定後の改変を防ぐ）
      if (reward.status !== "PENDING") {
        return NextResponse.json({ error: "金額の修正は承認待ちの報酬のみ可能です" }, { status: 400 });
      }
      const amount = parseInt(String(body.amount), 10);
      if (!Number.isFinite(amount) || amount < 0) {
        return NextResponse.json({ error: "金額が不正です" }, { status: 400 });
      }
      await prisma.affiliateReward.update({
        where: { id },
        data: { rewardAmount: amount },
      });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "不明な操作です" }, { status: 400 });
  } catch (e) {
    console.error("Reward update error:", e);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}
