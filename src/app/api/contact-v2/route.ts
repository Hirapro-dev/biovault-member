/**
 * /api/contact-v2
 *
 * v2 デザイン版お問い合わせフォーム(/form-v2-preview/contact)の送信API。
 *
 * - DBへの保存は行わない(メール送信のみ)
 * - 管理者通知メール(support@biovault.jp 宛て) と
 *   顧客向け自動返信メール の2通を SES で送信
 * - スキーム(SCPP/MRT)に応じて差出元会社情報を切替
 *
 * リクエストボディ:
 *   {
 *     name: string,    // 氏名(必須)
 *     email: string,   // メールアドレス(必須)
 *     message: string, // お問い合わせ内容(必須)
 *     scheme?: "SCPP" | "MRT" // 流入スキーム(省略時は SCPP)
 *   }
 */

import { NextResponse } from "next/server";
import {
  sendEmail,
  contactInquiryAdminEmail,
  contactInquiryCustomerEmail,
} from "@/lib/mail";
import { normalizeScheme } from "@/lib/scheme";

const ADMIN_EMAIL = "support@biovault.jp";

/** お問い合わせ本文の最大文字数(SES の送信制限と DoS 防止の観点) */
const MAX_MESSAGE_LENGTH = 5000;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "リクエスト形式が不正です" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "リクエスト形式が不正です" }, { status: 400 });
  }

  const { name, email, message, scheme } = body as {
    name?: unknown;
    email?: unknown;
    message?: unknown;
    scheme?: unknown;
  };

  // ── バリデーション ─────────────────────────
  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "お名前を入力してください" }, { status: 400 });
  }
  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json({ error: "お名前は100文字以内で入力してください" }, { status: 400 });
  }

  if (typeof email !== "string" || email.trim().length === 0) {
    return NextResponse.json({ error: "メールアドレスを入力してください" }, { status: 400 });
  }
  if (email.length > MAX_EMAIL_LENGTH || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "メールアドレスの形式が正しくありません" }, { status: 400 });
  }

  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "お問い合わせ内容を入力してください" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `お問い合わせ内容は${MAX_MESSAGE_LENGTH}文字以内で入力してください` },
      { status: 400 }
    );
  }

  const normalizedScheme = normalizeScheme(scheme);
  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedMessage = message.trim();

  // ── メール送信(管理者通知) ──────────────
  const admin = contactInquiryAdminEmail(trimmedName, trimmedEmail, trimmedMessage, normalizedScheme);
  const adminResult = await sendEmail({
    to: ADMIN_EMAIL,
    subject: admin.subject,
    bodyText: admin.bodyText,
    bodyHtml: admin.bodyHtml,
  });

  if (!adminResult.success) {
    return NextResponse.json(
      { error: "送信処理に失敗しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }

  // ── メール送信(顧客自動返信) ────────────
  // 顧客向けは管理者通知が成功している前提で送る。失敗してもユーザーには送信成功として返す
  // (管理者には届いているため担当者が個別対応可能)。
  const customer = contactInquiryCustomerEmail(trimmedName, trimmedMessage, normalizedScheme);
  const customerResult = await sendEmail({
    to: trimmedEmail,
    subject: customer.subject,
    bodyText: customer.bodyText,
    bodyHtml: customer.bodyHtml,
  });

  if (!customerResult.success) {
    // 顧客返信失敗は記録のみ(ユーザーには成功として返す)
    console.warn("Contact v2: customer auto-reply failed", { email: trimmedEmail });
  }

  return NextResponse.json({ success: true });
}
