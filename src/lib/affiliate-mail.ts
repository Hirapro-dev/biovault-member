/**
 * ご紹介協力制度（アフィリエイト）関連メールテンプレート
 * 送信は既存の sendEmail（src/lib/mail.ts / Amazon SES）を使用する。
 */

import { getCompany, type SchemeKey } from "./scheme";

const SCHEME: SchemeKey = "MRT"; // ご紹介協力制度はMRTスキーム固定

// 共通HTMLラッパー（既存メールのダークテーマに合わせる）
function wrapHtml(name: string, paragraphs: string[], highlight?: string) {
  const company = getCompany(SCHEME);
  const body = paragraphs
    .map(
      (p) =>
        `<p style="font-size:14px;color:#D5D5DE;line-height:1.8;margin:0 0 16px;">${p}</p>`
    )
    .join("\n      ");
  const highlightBox = highlight
    ? `<div style="background:#1A1A22;border:1px solid #BFA04B;border-radius:6px;padding:16px 20px;margin:8px 0 16px;font-size:14px;color:#ffffff;line-height:2;">${highlight}</div>`
    : "";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#070709;color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://member.biovault.jp/logo.png" alt="BioVault" style="height:40px;width:auto;" />
      <div style="width:60px;height:1px;background:linear-gradient(90deg,transparent,#BFA04B,transparent);margin:12px auto;"></div>
    </div>
    <div style="background:#111116;border:1px solid #2A2A38;border-radius:8px;padding:32px 24px;">
      <p style="font-size:16px;color:#ffffff;margin:0 0 24px;">${name} 様</p>
      ${body}
      ${highlightBox}
    </div>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #2A2A38;text-align:center;">
      <p style="font-size:12px;color:#A0A0B0;line-height:1.8;margin:0;">
        BioVault（${company.name}）<br>
        TEL: ${company.phone} ／ MAIL: ${company.supportEmail}<br>
        〒${company.postalCode} ${company.address}
      </p>
      <p style="font-size:10px;color:#727288;margin-top:16px;">
        ※ このメールは自動送信されています。
      </p>
    </div>
  </div>
</body>
</html>`;
}

function footerText() {
  const company = getCompany(SCHEME);
  return `──────────────────
BioVault（${company.name}）
TEL: ${company.phone}
MAIL: ${company.supportEmail}
〒${company.postalCode} ${company.address}
──────────────────

※ このメールは自動送信されています。
※ このメールに心当たりがない場合は、お手数ですが上記連絡先までご連絡ください。`;
}

// ① 協力者登録の受付（手動承認モード時: 承認待ちの案内）
export function affiliateRegistrationReceivedEmail(name: string) {
  const subject = "【BioVault】ご紹介協力制度へのご登録を受け付けました";
  const bodyText = `${name} 様

BioVault ご紹介協力制度へのご登録を
いただき、誠にありがとうございます。

ただいま事務局にて登録内容を確認しております。
確認が完了しましたら、ログイン情報と
ご紹介用URLをメールにてお送りいたします。

今しばらくお待ちくださいますよう
お願い申し上げます。


${footerText()}`;
  const bodyHtml = wrapHtml(name, [
    "BioVault ご紹介協力制度へのご登録をいただき、誠にありがとうございます。",
    "ただいま事務局にて登録内容を確認しております。確認が完了しましたら、ログイン情報とご紹介用URLをメールにてお送りいたします。",
    "今しばらくお待ちくださいますようお願い申し上げます。",
  ]);
  return { subject, bodyText, bodyHtml };
}

// ② 協力者アカウント発行（有効化時: ログイン情報 + 専用URL）
export function affiliateAccountCreatedEmail(
  name: string,
  loginId: string,
  password: string,
  lpUrl: string
) {
  const subject = "【BioVault】ご紹介協力者アカウントを発行しました";
  const bodyText = `${name} 様

BioVault ご紹介協力制度へのご登録が完了しました。

■ ログイン情報
ログインURL: https://member.biovault.jp/login
ログインID: ${loginId}
初回パスワード: ${password}
※ 初回ログイン時にパスワードの変更をお願いいたします。

■ あなた専用のご紹介用URL
${lpUrl}

上記URLを経由してお申込みがあった場合に、
ご紹介実績として記録されます。
実績・報酬は専用ページからご確認いただけます。


${footerText()}`;
  const bodyHtml = wrapHtml(
    name,
    [
      "BioVault ご紹介協力制度へのご登録が完了しました。",
      "以下のログイン情報で専用ページにログインし、ご紹介用URLをご利用ください。実績・報酬は専用ページからご確認いただけます。",
      "※ 初回ログイン時にパスワードの変更をお願いいたします。",
    ],
    `ログインURL: https://member.biovault.jp/login<br>ログインID: ${loginId}<br>初回パスワード: ${password}<br><br>ご紹介用URL:<br><a href="${lpUrl}" style="color:#BFA04B;">${lpUrl}</a>`
  );
  return { subject, bodyText, bodyHtml };
}

// ③ リード顧客への適合確認フォーム案内（架電「繋がった」記録時に自動送信）
export function ipsCheckInvitationEmail(name: string, formUrl: string) {
  const subject = "【BioVault】iPS細胞作製 適合確認のご案内";
  const bodyText = `${name} 様

このたびは、iPS細胞作製の無料適合確認に
お申込みいただき、誠にありがとうございます。

お電話にてご案内いたしました適合確認フォームを
お送りいたします。下記URLよりご入力ください。

■ 適合確認フォーム（${name}様専用URL）
${formUrl}

ご入力いただいた内容をもとに、提携する
iPS細胞作製ラボにて適合確認を行います。
確認の結果によっては、iPS細胞の作製に
適合しない場合がございます。
あらかじめご了承ください。

※ 本URLは${name}様専用のものです。
   第三者への転送はご遠慮ください。
※ ご不明な点がございましたら、下記まで
   お気軽にお問い合わせください。


${footerText()}`;
  const bodyHtml = wrapHtml(
    name,
    [
      "このたびは、iPS細胞作製の無料適合確認にお申込みいただき、誠にありがとうございます。",
      "お電話にてご案内いたしました適合確認フォームをお送りいたします。下記URLよりご入力ください。",
      "ご入力いただいた内容をもとに、提携するiPS細胞作製ラボにて適合確認を行います。確認の結果によっては、iPS細胞の作製に適合しない場合がございます。あらかじめご了承ください。",
      "※ 本URLはお客様専用のものです。第三者への転送はご遠慮ください。",
    ],
    `適合確認フォーム（${name}様専用URL）:<br><a href="${formUrl}" style="color:#BFA04B;">${formUrl}</a>`
  );
  return { subject, bodyText, bodyHtml };
}

// ④ 報酬確定通知（第一・第二共通）
export function affiliateRewardConfirmedEmail(
  name: string,
  rewardLabel: string, // 例: 第一報酬（リード獲得） / 第二報酬（本登録）
  amount: number
) {
  const formatted = amount.toLocaleString("ja-JP");
  const subject = "【BioVault】紹介報酬が確定しました";
  const bodyText = `${name} 様

いつもBioVault ご紹介協力制度にご協力いただき、
誠にありがとうございます。

ご紹介いただいた案件について、
下記の報酬が確定いたしましたので
お知らせいたします。

■ 確定内容
報酬種別: ${rewardLabel}
確定金額: ${formatted}円

報酬の詳細・累計は専用ページより
ご確認いただけます。
https://member.biovault.jp/login

お支払い時期・お振込先については
専用ページの設定をご確認ください。


${footerText()}`;
  const bodyHtml = wrapHtml(
    name,
    [
      "いつもBioVault ご紹介協力制度にご協力いただき、誠にありがとうございます。",
      "ご紹介いただいた案件について、下記の報酬が確定いたしましたのでお知らせいたします。",
      "報酬の詳細・累計は専用ページよりご確認いただけます。",
    ],
    `報酬種別: ${rewardLabel}<br>確定金額: ${formatted}円<br><br><a href="https://member.biovault.jp/login" style="color:#BFA04B;">専用ページへログイン</a>`
  );
  return { subject, bodyText, bodyHtml };
}
