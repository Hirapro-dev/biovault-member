import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * 会員の健康情報取得API
 * 申込時またはサービス申込時に登録した健康情報を返す
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未認証です" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentIllness: true,
      currentIllnessDetail: true,
      pastIllness: true,
      pastIllnessDetail: true,
      currentMedication: true,
      currentMedicationDetail: true,
      chronicDisease: true,
      chronicDiseaseDetail: true,
      infectiousDisease: true,
      infectiousDiseaseDetail: true,
      pregnancy: true,
      allergy: true,
      allergyDetail: true,
      otherHealth: true,
      otherHealthDetail: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  return NextResponse.json(user);
}
