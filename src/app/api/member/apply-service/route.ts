import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { notifyIpsStatusChange } from "@/lib/status-notification";

/**
 * iPSサービス利用申込API
 * 会員がサイト内からサービスに申し込む（880万円）
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  // 会員権の存在とステータス確認
  const membership = await prisma.membership.findUnique({
    where: { userId },
  });

  if (!membership) {
    return NextResponse.json({ error: "会員権が見つかりません" }, { status: 404 });
  }

  if (membership.ipsStatus !== "TERMS_AGREED") {
    return NextResponse.json(
      { error: "サービス申込にはまず重要事項説明への同意が必要です" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    const now = new Date();

    // iPSサービス付属の培養上清液1回分が既に存在するか確認
    const existingIncludedOrder = await prisma.cultureFluidOrder.findFirst({
      where: { userId, planType: "iv_drip_1_included" },
    });

    // トランザクションで一括更新
    const transactionOps: Prisma.PrismaPromise<unknown>[] = [
      // 1. ユーザーの健康状態・支払情報を更新
      prisma.user.update({
        where: { id: userId },
        data: {
          // 健康状態
          currentIllness: body.currentIllness || false,
          currentIllnessDetail: body.currentIllnessDetail || null,
          pastIllness: body.pastIllness || false,
          pastIllnessDetail: body.pastIllnessDetail || null,
          currentMedication: body.currentMedication || false,
          currentMedicationDetail: body.currentMedicationDetail || null,
          chronicDisease: body.chronicDisease || false,
          chronicDiseaseDetail: body.chronicDiseaseDetail || null,
          infectiousDisease: body.infectiousDisease || false,
          infectiousDiseaseDetail: body.infectiousDiseaseDetail || null,
          pregnancy: body.pregnancy || false,
          allergy: body.allergy || false,
          allergyDetail: body.allergyDetail || null,
          otherHealth: body.otherHealth || false,
          otherHealthDetail: body.otherHealthDetail || null,
          // 支払情報
          paymentMethod: body.paymentMethod || "bank_transfer",
          paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
        },
      }),
      // 2. Membershipのステータスを SERVICE_APPLIED に更新
      prisma.membership.update({
        where: { userId },
        data: {
          ipsStatus: "SERVICE_APPLIED",
          serviceAppliedAt: now,
          consentSignedAt: now,
          contractFormat: body.contractFormat || "electronic",
        },
      }),
      // 3. ステータス履歴を記録
      prisma.statusHistory.create({
        data: {
          userId,
          fromStatus: "TERMS_AGREED",
          toStatus: "SERVICE_APPLIED",
          note: "会員本人によるiPSサービス利用申込",
          changedBy: "会員本人",
        },
      }),
    ];

    // 4. iPSサービス付属の培養上清液点滴1回分を自動作成
    //（880万円に含まれるため金額0、入金済み状態）
    //（留意事項の同意はクリニック予約時に行うため cautionAgreedAt は未設定）
    if (!existingIncludedOrder) {
      transactionOps.push(
        prisma.cultureFluidOrder.create({
          data: {
            userId,
            planType: "iv_drip_1_included",
            planLabel: "点滴1回分（10ml）※iPSサービス付属",
            totalAmount: 0,
            paymentStatus: "COMPLETED",
            paidAt: now,
            status: "APPLIED",
          },
        })
      );
    }

    await prisma.$transaction(transactionOps);

    // iPSサービス利用規約（SERVICE_TERMS）を同意済みに更新
    // 申込フロー内で利用規約に同意しているため
    await prisma.document.updateMany({
      where: { userId, type: "SERVICE_TERMS", status: "PENDING" },
      data: { status: "SIGNED", signedAt: now },
    });

    // ステータス変更通知
    const memberInfo = await prisma.membership.findUnique({
      where: { userId },
      select: { memberNumber: true, user: { select: { name: true } } },
    });
    if (memberInfo) {
      notifyIpsStatusChange({
        userId,
        memberName: memberInfo.user.name,
        memberNumber: memberInfo.memberNumber,
        fromStatus: "TERMS_AGREED",
        toStatus: "SERVICE_APPLIED",
        changedBy: "会員本人",
        note: "会員本人によるiPSサービス利用申込",
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("サービス申込エラー:", error);
    return NextResponse.json(
      { error: "申込処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
