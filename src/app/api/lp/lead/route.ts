import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  AFFILIATE_COOKIE,
  LEAD_COOKIE,
  LEAD_COOKIE_MAX_AGE,
  getAffiliateSettings,
  resolveRewardAmount,
} from "@/lib/affiliate";
import { sendEmail, affiliateLeadAdminEmail, affiliateLeadCustomerEmail } from "@/lib/mail";

// LP新規リードの通知先（カンマ区切りで複数指定可）
// 既定: マスター通知アドレス + 指定の平山様アドレス
const LP_LEAD_NOTIFY_EMAILS = (
  process.env.LP_LEAD_NOTIFY_EMAILS ||
  "app@biovault.jp,y3awtd-hirayama-p@hdbronze.htdb.jp"
)
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

// リード登録（LP経由の見込み顧客・公開API）
// 重複でなければ第一報酬を PENDING で自動起票する
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // honeypot（botはこの不可視フィールドを埋める）
    if (body.website) {
      return NextResponse.json({ success: true });
    }

    // 必須チェック
    const name = (body.name || "").trim();
    const nameKana = (body.nameKana || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const address = (body.address || "").trim();
    const phoneRaw = (body.phone || "").trim();
    if (!name || !nameKana || !email || !address || !phoneRaw) {
      return NextResponse.json({ error: "必須項目が入力されていません" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "メールアドレスの形式が正しくありません" }, { status: 400 });
    }
    // 電話番号は数字のみに正規化して保存（重複判定を確実にするため）
    const phone = phoneRaw.replace(/[^0-9]/g, "");
    if (phone.length < 10 || phone.length > 11) {
      return NextResponse.json({ error: "電話番号の形式が正しくありません" }, { status: 400 });
    }

    // ご紹介協力者の特定: URLパラメータ優先、なければCookie
    const ref =
      (typeof body.ref === "string" && body.ref.trim()) ||
      req.cookies.get(AFFILIATE_COOKIE)?.value ||
      "";
    if (!/^AF-\d{4,}$/.test(ref)) {
      return NextResponse.json(
        { error: "紹介元が確認できませんでした。紹介者から案内されたURLからアクセスしてください。" },
        { status: 400 }
      );
    }

    const profile = await prisma.affiliateProfile.findUnique({
      where: { affiliateCode: ref },
    });
    if (!profile || profile.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "紹介元が確認できませんでした。紹介者から案内されたURLからアクセスしてください。" },
        { status: 400 }
      );
    }

    // 重複判定: 同一電話番号 or 同一メールのリードが既にあれば報酬対象外
    const existing = await prisma.affiliateLead.findFirst({
      where: { OR: [{ phone }, { email }] },
      select: { id: true },
    });
    const isDuplicate = !!existing;

    // 会員としても既に登録済みなら重複扱い
    const existingUser = isDuplicate
      ? null
      : await prisma.user.findFirst({
          where: { email, role: "MEMBER" },
          select: { id: true },
        });
    const duplicate = isDuplicate || !!existingUser;

    const lead = await prisma.affiliateLead.create({
      data: {
        affiliateProfileId: profile.id,
        name,
        nameKana,
        postalCode: (body.postalCode || "").trim() || null,
        email,
        address,
        phone,
        occupation: (body.occupation || "").trim() || null,
        income: (body.income || "").trim() || null,
        isDuplicate: duplicate,
      },
    });

    // 第一報酬の起票（重複リードは対象外）
    // 金額が未設定(0円)でも起票し、管理画面から金額修正・承認できるようにする
    if (!duplicate) {
      const settings = await getAffiliateSettings();
      const amount = resolveRewardAmount(profile, "LEAD", settings);
      await prisma.affiliateReward.create({
        data: {
          affiliateProfileId: profile.id,
          rewardType: "LEAD",
          leadId: lead.id,
          memberName: name,
          rewardAmount: amount,
          status: "PENDING",
        },
      });
    }

    // 管理者・担当者へ新規リード通知（送信失敗はリード登録の成否に影響させない）
    try {
      const mail = affiliateLeadAdminEmail({
        name,
        nameKana,
        email,
        phone,
        postalCode: lead.postalCode,
        address,
        occupation: lead.occupation,
        income: lead.income,
        createdAt: lead.createdAt,
      });
      await Promise.all(
        LP_LEAD_NOTIFY_EMAILS.map((to) => sendEmail({ to, ...mail }))
      );
    } catch (mailErr) {
      console.error("Lead notification email failed:", mailErr);
    }

    // 申込者本人へ自動返信メール（LPはMRTスキーム。送信失敗はリード登録に影響させない）
    try {
      const customerMail = affiliateLeadCustomerEmail(name, "MRT");
      await sendEmail({ to: email, ...customerMail });
    } catch (mailErr) {
      console.error("Lead auto-reply email failed:", mailErr);
    }

    // 申込フォームでの自動入力用に、このブラウザとリードを紐づけるCookieを発行
    const res = NextResponse.json({ success: true });
    res.cookies.set(LEAD_COOKIE, lead.id, {
      maxAge: LEAD_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("Lead registration error:", e);
    return NextResponse.json({ error: "登録に失敗しました。時間をおいて再度お試しください。" }, { status: 500 });
  }
}
