import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * iPSサービス申込API
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

    // トランザクションで一括更新
    await prisma.$transaction([
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
          serviceAppliedAt: new Date(),
        },
      }),
      // 3. ステータス履歴を記録
      prisma.statusHistory.create({
        data: {
          userId,
          fromStatus: "TERMS_AGREED",
          toStatus: "SERVICE_APPLIED",
          note: "会員本人によるiPSサービス申込",
          changedBy: "会員本人",
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("サービス申込エラー:", error);
    return NextResponse.json(
      { error: "申込処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
