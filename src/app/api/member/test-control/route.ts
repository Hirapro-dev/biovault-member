import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { IpsStatus } from "@prisma/client";

/**
 * テスト操作API
 *
 * テスターアカウント（TESTER_EMAILS環境変数で指定）のみ利用可能。
 * ステータスを次に進める / 全リセットする操作を提供する。
 */

const TESTER_EMAILS = (process.env.TESTER_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

function isTesterEmail(email: string): boolean {
  return TESTER_EMAILS.includes(email.toLowerCase());
}

/** ユーザーIDからDBのメールを取得してテスターか判定 */
async function checkIsTester(userId: string): Promise<boolean> {
  if (TESTER_EMAILS.length === 0) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return user ? isTesterEmail(user.email) : false;
}

// iPSステータスの順序
const IPS_STATUS_ORDER: IpsStatus[] = [
  "REGISTERED",
  "TERMS_AGREED",
  "SERVICE_APPLIED",
  "SCHEDULE_ARRANGED",
  "BLOOD_COLLECTED",
  "IPS_CREATING",
  "STORAGE_ACTIVE",
];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;

  if (!(await checkIsTester(userId))) {
    return NextResponse.json({ error: "テスト機能は利用できません" }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body; // "next" | "reset"

  const membership = await prisma.membership.findUnique({
    where: { userId },
  });

  if (!membership) {
    return NextResponse.json({ error: "会員権が見つかりません" }, { status: 404 });
  }

  if (action === "next") {
    // 次のステータスに進める
    const currentIdx = IPS_STATUS_ORDER.indexOf(membership.ipsStatus);
    if (currentIdx === -1 || currentIdx >= IPS_STATUS_ORDER.length - 1) {
      return NextResponse.json({ error: "これ以上進められません" }, { status: 400 });
    }

    const nextStatus = IPS_STATUS_ORDER[currentIdx + 1];
    const now = new Date();
    const updateData: Record<string, unknown> = { ipsStatus: nextStatus };

    // ステータスに応じた追加データ
    if (nextStatus === "SERVICE_APPLIED" && !membership.serviceAppliedAt) {
      updateData.serviceAppliedAt = now;
      updateData.consentSignedAt = now;
      updateData.contractSignedAt = now;
      updateData.contractFormat = "electronic";
    }
    if (nextStatus === "SCHEDULE_ARRANGED") {
      updateData.clinicDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 2週間後
      updateData.clinicName = "テストクリニック";
    }
    if (nextStatus === "BLOOD_COLLECTED" || nextStatus === "IPS_CREATING") {
      updateData.ipsCompletedAt = now;
    }
    if (nextStatus === "STORAGE_ACTIVE") {
      updateData.storageStartAt = now;
      if (!membership.ipsCompletedAt) updateData.ipsCompletedAt = now;
    }

    await prisma.$transaction([
      prisma.membership.update({
        where: { userId },
        data: updateData,
      }),
      prisma.statusHistory.create({
        data: {
          userId,
          fromStatus: membership.ipsStatus,
          toStatus: nextStatus,
          note: "テストモード: ステータスを次に進める",
          changedBy: "テストモード",
        },
      }),
    ]);

    // SERVICE_APPLIED の場合、必要な書類と同意も自動設定
    if (nextStatus === "SERVICE_APPLIED") {
      await prisma.user.update({
        where: { id: userId },
        data: { hasAgreedTerms: true, agreedTermsAt: now },
      });
      await prisma.document.updateMany({
        where: { userId, status: "PENDING" },
        data: { status: "SIGNED", signedAt: now },
      });
      // 培養上清液付属分の作成
      const existing = await prisma.cultureFluidOrder.findFirst({
        where: { userId, planType: "iv_drip_1_included" },
      });
      if (!existing) {
        await prisma.cultureFluidOrder.create({
          data: {
            userId,
            planType: "iv_drip_1_included",
            planLabel: "点滴1回分（10ml）※iPSサービス付属",
            totalAmount: 0,
            paymentStatus: "COMPLETED",
            paidAt: now,
            status: "APPLIED",
          },
        });
      }
    }

    // STORAGE_ACTIVE の場合、培養上清液の精製も開始
    if (nextStatus === "STORAGE_ACTIVE") {
      const includedOrder = await prisma.cultureFluidOrder.findFirst({
        where: { userId, planType: "iv_drip_1_included" },
      });
      if (includedOrder && !includedOrder.producedAt) {
        const producedAt = new Date(now);
        producedAt.setMonth(producedAt.getMonth() + 1);
        const expiresAt = new Date(producedAt);
        expiresAt.setMonth(expiresAt.getMonth() + 8);
        await prisma.cultureFluidOrder.update({
          where: { id: includedOrder.id },
          data: { status: "PAYMENT_CONFIRMED", producedAt, expiresAt },
        });
      }
    }

    return NextResponse.json({
      success: true,
      from: membership.ipsStatus,
      to: nextStatus,
    });
  }

  if (action === "reset") {
    // 全リセット
    const now = new Date();

    await prisma.$transaction([
      // ステータスをREGISTEREDに戻す
      prisma.membership.update({
        where: { userId },
        data: {
          ipsStatus: "REGISTERED",
          serviceAppliedAt: null,
          consentSignedAt: null,
          contractSignedAt: null,
          contractFormat: null,
          clinicDate: null,
          clinicName: null,
          clinicAddress: null,
          clinicPhone: null,
          ipsCompletedAt: null,
          storageStartAt: null,
          paymentStatus: "PENDING",
          paidAmount: 0,
          deathWish: null,
        },
      }),
      // 重要事項同意をリセット
      prisma.user.update({
        where: { id: userId },
        data: {
          hasAgreedTerms: false,
          agreedTermsAt: null,
        },
      }),
      // 書類をPENDINGに戻す
      prisma.document.updateMany({
        where: { userId },
        data: { status: "PENDING", signedAt: null },
      }),
      // 培養上清液注文を全削除
      prisma.cultureFluidOrder.deleteMany({
        where: { userId },
      }),
      // ステータス履歴にリセットを記録
      prisma.statusHistory.create({
        data: {
          userId,
          fromStatus: membership.ipsStatus,
          toStatus: "REGISTERED",
          note: "テストモード: 全ステータスをリセット",
          changedBy: "テストモード",
        },
      }),
    ]);

    return NextResponse.json({ success: true, action: "reset" });
  }

  return NextResponse.json({ error: "不正なアクション" }, { status: 400 });
}

// テスターかどうかの判定用GET
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ isTester: false });
  }

  const userId = (session.user as { id: string }).id;
  const result = await checkIsTester(userId);
  return NextResponse.json({ isTester: result });
}
