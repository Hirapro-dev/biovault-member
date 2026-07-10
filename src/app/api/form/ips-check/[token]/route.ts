import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * 適合確認フォーム提出（リード専用URL版・公開API）
 *
 * トークンでリードを特定し、LP登録済み情報（メール・住所・職業）と
 * フォーム入力（氏名・フリガナ・生年月日・電話・健康状態・同意）をマージして
 * 既存の申込API(/api/apply)に転送する。成功後にアフィリエイト紐付けを行う。
 */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = await req.json();

    const lead = await prisma.affiliateLead.findUnique({
      where: { formToken: token },
      include: { affiliateProfile: { select: { affiliateCode: true } } },
    });

    if (!lead) {
      return NextResponse.json({ error: "URLが無効です" }, { status: 404 });
    }
    if (lead.applicationId) {
      return NextResponse.json({ error: "このURLからの申請は完了しています" }, { status: 400 });
    }

    // 必須チェック（メール・住所はリード登録時の情報を使用）
    if (!body.name || !body.nameKana || !body.dateOfBirth || !body.phone) {
      return NextResponse.json({ error: "必須項目が入力されていません" }, { status: 400 });
    }

    // 既存の申込APIへ転送するペイロードを構築
    const payload = {
      name: body.name,
      nameKana: body.nameKana,
      dateOfBirth: body.dateOfBirth,
      address: lead.address,
      phone: body.phone,
      email: lead.email,
      occupation: lead.occupation || null,
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
      // 同意
      confirmNotMedical: body.confirmNotMedical || false,
      // ご紹介協力制度はMRTスキーム固定
      scheme: "MRT",
    };

    // 既存の申込処理を再利用（Application + User + 書類 + 通知を一括作成）
    const applyRes = await fetch(new URL("/api/apply", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const applyData = await applyRes.json();
    if (!applyRes.ok) {
      return NextResponse.json(
        { error: applyData.error || "申請の登録に失敗しました" },
        { status: applyRes.status }
      );
    }

    // アフィリエイト紐付け（申込・ユーザー・リードの三者を関連付け）
    const affiliateCode = lead.affiliateProfile.affiliateCode;
    await prisma.$transaction([
      prisma.application.update({
        where: { id: applyData.id },
        data: { referredByAffiliate: affiliateCode, affiliateLeadId: lead.id },
      }),
      prisma.user.update({
        where: { id: applyData.userId },
        data: { referredByAffiliate: affiliateCode },
      }),
      prisma.affiliateLead.update({
        where: { id: lead.id },
        data: { applicationId: applyData.id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("IPS check form error:", e);
    return NextResponse.json({ error: "送信に失敗しました。時間をおいて再度お試しください。" }, { status: 500 });
  }
}
