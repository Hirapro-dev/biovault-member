import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkEmailDuplicate } from "@/lib/email-duplicate";
import {
  affiliateLpUrl,
  generateAffiliateCode,
  generatePassword,
  generateUniqueLoginId,
  getAffiliateSettings,
} from "@/lib/affiliate";
import { sendEmail } from "@/lib/mail";
import {
  affiliateAccountCreatedEmail,
  affiliateRegistrationReceivedEmail,
} from "@/lib/affiliate-mail";

// ご紹介協力者のセルフ登録（公開API）
// 自動承認モード: 即時有効化しログイン情報を送付
// 手動承認モード: 承認待ちで作成し受付メールのみ送付
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // honeypot
    if (body.website) {
      return NextResponse.json({ success: true, pending: true });
    }

    const name = (body.name || "").trim();
    const nameKana = (body.nameKana || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const phone = (body.phone || "").trim();
    const postalCode = (body.postalCode || "").trim();
    const address = (body.address || "").trim();
    const dateOfBirth = (body.dateOfBirth || "").trim();
    const channel = body.channel === "KAWARA" ? "KAWARA" : body.channel === "NW" ? "NW" : null;

    if (!name || !nameKana || !email || !phone || !address || !dateOfBirth || !channel) {
      return NextResponse.json({ error: "必須項目が入力されていません" }, { status: 400 });
    }
    const birth = new Date(dateOfBirth);
    if (isNaN(birth.getTime())) {
      return NextResponse.json({ error: "生年月日の形式が正しくありません" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "メールアドレスの形式が正しくありません" }, { status: 400 });
    }
    if (!body.hasAgreedTerms) {
      return NextResponse.json({ error: "規約への同意が必要です" }, { status: 400 });
    }

    // メール重複チェック（既存会員・協力者との重複を防ぐ）
    const dupErr = await checkEmailDuplicate(email);
    if (dupErr) {
      return NextResponse.json({ error: dupErr }, { status: 400 });
    }

    const settings = await getAffiliateSettings();
    const autoApprove = settings.autoApprove;

    const affiliateCode = await generateAffiliateCode();
    const loginId = await generateUniqueLoginId(nameKana);
    const tempPassword = generatePassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await prisma.user.create({
      data: {
        loginId,
        email,
        passwordHash,
        name,
        nameKana,
        phone,
        postalCode: postalCode || null,
        address,
        dateOfBirth: birth,
        role: "AFFILIATE",
        isIdIssued: autoApprove, // 手動承認モードでは承認時に有効化
        mustChangePassword: true,
        scheme: "MRT",
        affiliateProfile: {
          create: {
            affiliateCode,
            channel,
            status: autoApprove ? "ACTIVE" : "PENDING",
            displayName: (body.displayName || "").trim() || null,
            hasAgreedTerms: true,
            agreedAt: new Date(),
            scheme: "MRT",
          },
        },
      },
    });

    // メール送信（失敗しても登録自体は成立させる）
    try {
      if (autoApprove) {
        const mail = affiliateAccountCreatedEmail(name, loginId, tempPassword, affiliateLpUrl(affiliateCode));
        await sendEmail({ to: email, ...mail });
      } else {
        const mail = affiliateRegistrationReceivedEmail(name);
        await sendEmail({ to: email, ...mail });
      }
    } catch (e) {
      console.error("Affiliate registration email failed:", e);
    }

    return NextResponse.json({ success: true, pending: !autoApprove });
  } catch (e) {
    console.error("Partner registration error:", e);
    return NextResponse.json({ error: "登録に失敗しました。時間をおいて再度お試しください。" }, { status: 500 });
  }
}
