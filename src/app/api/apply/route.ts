import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendEmail, applicationReceivedEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
  const body = await req.json();

  // 必須チェック
  if (!body.name || !body.nameKana || !body.dateOfBirth || !body.address || !body.phone || !body.email) {
    return NextResponse.json({ error: "必須項目が入力されていません" }, { status: 400 });
  }

  // メール重複チェック
  const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
  if (existingUser) {
    return NextResponse.json({ error: "このメールアドレスは既に登録されています" }, { status: 400 });
  }

  // 0. 代理店コードから代理店名を自動解決
  let referrerName: string | null = null;
  const agencyCode = body.referredByAgency || null;
  if (agencyCode) {
    const agencyProfile = await prisma.agencyProfile.findUnique({
      where: { agencyCode },
      select: { companyName: true, user: { select: { name: true } } },
    });
    if (agencyProfile) {
      referrerName = agencyProfile.companyName || agencyProfile.user.name || agencyCode;
    }
  }
  // 従業員コードから従業員名を自動解決
  const staffCodeValue = body.staffCode || null;
  let salesRepName: string | null = body.salesRepName || null;
  if (staffCodeValue) {
    const staffRecord = await prisma.staff.findUnique({
      where: { staffCode: staffCodeValue },
      select: { name: true },
    });
    if (staffRecord) {
      salesRepName = staffRecord.name;
    }
  }

  // 1. 申込データを保存
  const application = await prisma.application.create({
    data: {
      name: body.name,
      nameKana: body.nameKana,
      dateOfBirth: new Date(body.dateOfBirth),
      postalCode: body.postalCode || null,
      address: body.address,
      phone: body.phone,
      email: body.email,
      occupation: body.occupation || null,
      paymentMethod: body.paymentMethod || "bank_transfer",
      paymentMethodOther: body.paymentMethodOther || null,
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
      referrerName,
      salesRepName,
      staffCode: staffCodeValue,
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
      confirmNotMedical: body.confirmNotMedical || false,
      confirmScppRole: body.confirmScppRole || false,
      confirmClinicRole: body.confirmClinicRole || false,
      confirmLabRole: body.confirmLabRole || false,
      confirmDocuments: body.confirmDocuments || false,
      receivedContract: body.receivedContract || false,
      receivedTerms: body.receivedTerms || false,
      receivedImportant: body.receivedImportant || false,
      receivedMedicalCheck: body.receivedMedicalCheck || false,
      receivedPrivacy: body.receivedPrivacy || false,
      receivedCellStorage: body.receivedCellStorage || false,
      receivedIpsConsent: body.receivedIpsConsent || false,
    },
  });

  // 2. ログインID生成（苗字ローマ字 + 4桁）
  const loginId = await generateUniqueLoginId(body.nameKana);

  // 3. 仮パスワード生成
  const tempPassword = generatePassword();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  // 4. 会員番号の自動採番
  const lastMembership = await prisma.membership.findFirst({
    orderBy: { memberNumber: "desc" },
  });
  const nextNumber = lastMembership
    ? parseInt(lastMembership.memberNumber.replace("BV-", "")) + 1
    : 1;
  const memberNumber = `BV-${String(nextNumber).padStart(4, "0")}`;

  // 5. ユーザー + 会員権 + 書類を一括作成
  const user = await prisma.user.create({
    data: {
      loginId,
      email: body.email,
      passwordHash,
      name: body.name,
      nameKana: body.nameKana,
      phone: body.phone,
      dateOfBirth: new Date(body.dateOfBirth),
      postalCode: body.postalCode || null,
      address: body.address,
      occupation: body.occupation || null,
      role: "MEMBER",
      isIdIssued: false,
      mustChangePassword: true,
      referredByAgency: agencyCode,
      referredByStaff: staffCodeValue,
      applicationId: application.id,
      paymentMethod: body.paymentMethod || "bank_transfer",
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
      salesRepName,
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
      membership: {
        create: {
          memberNumber,
          plan: "STANDARD",
          contractDate: new Date(),
          totalAmount: 8800000,
          referrerName,
        },
      },
    },
  });

  // デフォルト書類を作成
  await prisma.document.createMany({
    data: [
      { userId: user.id, type: "CONTRACT", title: "会員契約書（細胞保管委託契約書）", status: "PENDING" },
      { userId: user.id, type: "CONSENT_CELL_STORAGE", title: "メンバーシップ契約書", status: "PENDING" },
      { userId: user.id, type: "CELL_STORAGE_CONSENT", title: "細胞提供・保管同意書", status: "PENDING" },
      { userId: user.id, type: "INFORMED_CONSENT", title: "iPS細胞作製における事前説明・同意", status: "PENDING" },
      { userId: user.id, type: "PRIVACY_POLICY", title: "個人情報取扱同意書", status: "PENDING" },
      { userId: user.id, type: "SIMPLE_AGREEMENT", title: "簡易規約", status: "PENDING" },
    ],
  });

  // 6. 申込ステータスを更新
  await prisma.application.update({
    where: { id: application.id },
    data: { status: "REGISTERED", convertedUserId: user.id },
  });

  // 7. 自動返信メール送信
  try {
    const emailContent = applicationReceivedEmail(body.name);
    await sendEmail({ to: body.email, ...emailContent });
  } catch (e) {
    console.error("Auto-reply email failed:", e);
  }

  return NextResponse.json({
    id: application.id,
    userId: user.id,
    loginId,
    tempPassword,
    memberNumber,
    success: true,
  });

  } catch (error: unknown) {
    console.error("Application error:", error);
    const message = error instanceof Error ? error.message : "不明なエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── ユーティリティ ──

const KANA_MAP: Record<string, string> = {
  "ア":"a","イ":"i","ウ":"u","エ":"e","オ":"o","カ":"ka","キ":"ki","ク":"ku","ケ":"ke","コ":"ko",
  "サ":"sa","シ":"shi","ス":"su","セ":"se","ソ":"so","タ":"ta","チ":"chi","ツ":"tsu","テ":"te","ト":"to",
  "ナ":"na","ニ":"ni","ヌ":"nu","ネ":"ne","ノ":"no","ハ":"ha","ヒ":"hi","フ":"fu","ヘ":"he","ホ":"ho",
  "マ":"ma","ミ":"mi","ム":"mu","メ":"me","モ":"mo","ヤ":"ya","ユ":"yu","ヨ":"yo",
  "ラ":"ra","リ":"ri","ル":"ru","レ":"re","ロ":"ro","ワ":"wa","ヲ":"wo","ン":"n",
  "ガ":"ga","ギ":"gi","グ":"gu","ゲ":"ge","ゴ":"go","ザ":"za","ジ":"ji","ズ":"zu","ゼ":"ze","ゾ":"zo",
  "ダ":"da","ヂ":"di","ヅ":"du","デ":"de","ド":"do","バ":"ba","ビ":"bi","ブ":"bu","ベ":"be","ボ":"bo",
  "パ":"pa","ピ":"pi","プ":"pu","ペ":"pe","ポ":"po","ッ":"tt","ー":"",
};

function kataToRomaji(kana: string): string {
  let r = "", i = 0;
  while (i < kana.length) {
    if (i + 1 < kana.length) { const two = kana.substring(i, i + 2); if (KANA_MAP[two]) { r += KANA_MAP[two]; i += 2; continue; } }
    if (kana[i] === "ッ" && i + 1 < kana.length) { const n = KANA_MAP[kana[i + 1]]; if (n) r += n[0]; i++; continue; }
    if (KANA_MAP[kana[i]] !== undefined) r += KANA_MAP[kana[i]];
    i++;
  }
  return r;
}

async function generateUniqueLoginId(nameKana: string): Promise<string> {
  const lastName = nameKana.trim().split(/[\s　]+/)[0];
  const base = kataToRomaji(lastName).toLowerCase() || "user";
  for (let attempt = 0; attempt < 100; attempt++) {
    const num = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    const loginId = `${base}${num}`;
    const exists = await prisma.user.findUnique({ where: { loginId } });
    if (!exists) return loginId;
  }
  throw new Error("ログインIDの生成に失敗しました");
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 8; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
}
