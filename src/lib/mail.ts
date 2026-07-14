/**
 * メール送信ライブラリ（Amazon SES）
 *
 * 環境変数:
 *   AWS_SES_REGION       - SESのリージョン（例: ap-northeast-1）
 *   AWS_SES_ACCESS_KEY   - IAMアクセスキー
 *   AWS_SES_SECRET_KEY   - IAMシークレットキー
 *   EMAIL_FROM           - 送信元メールアドレス（SESで検証済み）
 */

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { getCompany, type SchemeKey } from "./scheme";

const ses = new SESClient({
  region: process.env.AWS_SES_REGION || "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY || "",
    secretAccessKey: process.env.AWS_SES_SECRET_KEY || "",
  },
});

const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@biovault.jp";
const FROM_NAME = "BioVault";

export async function sendEmail({
  to,
  subject,
  bodyText,
  bodyHtml,
}: {
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
}) {
  const command = new SendEmailCommand({
    Source: `${FROM_NAME} <${FROM_EMAIL}>`,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: {
        Text: { Data: bodyText, Charset: "UTF-8" },
        ...(bodyHtml ? { Html: { Data: bodyHtml, Charset: "UTF-8" } } : {}),
      },
    },
  });

  try {
    await ses.send(command);
    return { success: true };
  } catch (error) {
    console.error("SES send error:", error);
    return { success: false, error };
  }
}

// ── メールテンプレート ──

export function applicationReceivedEmail(name: string, scheme?: SchemeKey) {
  const company = getCompany(scheme);
  const subject = "【BioVault】iPS細胞作製の適合確認申込を受け付けました";
  const bodyText = `${name} 様

iPS細胞作製の適合確認申込をいただき、
誠にありがとうございます。

お申込みいただいた内容をもとに、
iPS細胞作製の適合確認を行います。

3営業日以内に担当スタッフより
改めてご連絡させていただきます。

ご不明な点がございましたら、
下記までお気軽にお問い合わせください。

iPS作製適合確認を行わせていただく上で、
適格でない場合がございます。
その際はあらかじめご了承ください。


──────────────────
BioVault（${company.name}）
TEL: ${company.phone}
MAIL: ${company.supportEmail}
〒${company.postalCode} ${company.address}
──────────────────

※ このメールは自動送信されています。
※ このメールに心当たりがない場合は、お手数ですが上記連絡先までご連絡ください。`;

  const bodyHtml = `
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
      <p style="font-size:14px;color:#D5D5DE;line-height:1.8;margin:0 0 16px;">
        iPS細胞作製の適合確認申込をいただき、誠にありがとうございます。
      </p>
      <p style="font-size:14px;color:#D5D5DE;line-height:1.8;margin:0 0 16px;">
        お申込みいただいた内容をもとに、iPS細胞作製の適合確認を行います。 </p>
      <p style="font-size:14px;color:#D5D5DE;line-height:1.8;margin:0;">
        3営業日以内に担当スタッフより改めてご連絡させていただきます。
      </p>
      <p style="font-size:14px;color:#D5D5DE;line-height:1.8;margin:0;">
      ご不明な点がございましたら、下記までお気軽にお問い合わせください。
      </p>
      <p style="font-size:14px;color:#D5D5DE;line-height:1.8;margin:0;">
        iPS作製適合確認を行わせていただく上で、適格でない場合がございます。その際はあらかじめご了承ください。
      </p>
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

  return { subject, bodyText, bodyHtml };
}

export function agencyApplicationReceivedEmail(name: string, scheme?: SchemeKey) {
  const company = getCompany(scheme);
  const subject = "【BioVault】エージェント申込を受け付けました";
  const bodyText = `${name} 様

BioVault エージェント申込をいただき、
誠にありがとうございます。

お申込みいただいた内容をもとに、
審査および準備を進めさせていただきます。

追ってアカウント発行のご案内を
メールにてお送りさせていただきます。

ご不明な点がございましたら、
下記までお気軽にお問い合わせください。


──────────────────
BioVault（${company.name}）
TEL: ${company.phone}
MAIL: ${company.supportEmail}
〒${company.postalCode} ${company.address}
──────────────────

※ このメールは自動送信されています。
※ このメールに心当たりがない場合は、お手数ですが上記連絡先までご連絡ください。`;

  const bodyHtml = `
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
      <p style="font-size:14px;color:#D5D5DE;line-height:1.8;margin:0 0 16px;">
        BioVault エージェント申込をいただき、誠にありがとうございます。
      </p>
      <p style="font-size:14px;color:#D5D5DE;line-height:1.8;margin:0 0 16px;">
        お申込みいただいた内容をもとに、審査および準備を進めさせていただきます。
      </p>
      <p style="font-size:14px;color:#D5D5DE;line-height:1.8;margin:0 0 16px;">
        追ってアカウント発行のご案内をメールにてお送りさせていただきます。
      </p>
      <p style="font-size:14px;color:#D5D5DE;line-height:1.8;margin:0;">
        ご不明な点がございましたら、下記までお気軽にお問い合わせください。
      </p>
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

  return { subject, bodyText, bodyHtml };
}

export function adminAccountCreatedEmail(
  name: string,
  loginId: string,
  password: string,
  roleLabel: string,
  scheme?: SchemeKey
) {
  const company = getCompany(scheme);
  const subject = "【BioVault】管理画面アカウントが発行されました";
  const bodyText = `${name} 様

BioVault 管理画面のアカウントが発行されました。
以下の情報でログインしてください。

────────────
ロール: ${roleLabel}
ログインID: ${loginId}
パスワード: ${password}
────────────

ログインページ: https://member.biovault.jp/login

※ 初回ログイン後、パスワードの変更をお願いいたします。
※ ログインID・パスワードは第三者に知られないよう大切に管理してください。

ご不明な点がございましたら、下記までお気軽にお問い合わせください。

──────────────────
BioVault（${company.name}）
TEL: ${company.phone}
MAIL: ${company.supportEmail}
──────────────────`;

  const bodyHtml = `
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
      <p style="font-size:16px;color:#ffffff;margin:0 0 8px;">${name} 様</p>
      <p style="font-size:14px;color:#D5D5DE;line-height:1.8;margin:0 0 24px;">
        BioVault 管理画面のアカウントが発行されました。<br>
        以下の情報でログインしてください。
      </p>
      <div style="background:#1A1A22;border:1px solid #2A2A38;border-radius:6px;padding:20px;margin-bottom:24px;">
        <div style="font-size:11px;color:#A0A0B0;margin-bottom:4px;">ロール</div>
        <div style="font-size:14px;color:#BFA04B;margin-bottom:16px;">${roleLabel}</div>
        <div style="font-size:11px;color:#A0A0B0;margin-bottom:4px;">ログインID</div>
        <div style="font-size:18px;color:#BFA04B;font-family:monospace;letter-spacing:2px;margin-bottom:16px;">${loginId}</div>
        <div style="font-size:11px;color:#A0A0B0;margin-bottom:4px;">パスワード</div>
        <div style="font-size:14px;color:#BFA04B;font-family:monospace;letter-spacing:1px;">${password}</div>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://member.biovault.jp/login" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#BFA04B,#8F7A3E);color:#070709;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:2px;border-radius:4px;">ログインページへ</a>
      </div>
      <p style="font-size:12px;color:#A0A0B0;line-height:1.8;margin:0;">
        ※ 初回ログイン後、パスワードの変更をお願いいたします。<br>
        ※ ログイン情報は第三者に知られないよう大切に管理してください。
      </p>
    </div>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #2A2A38;text-align:center;">
      <p style="font-size:12px;color:#A0A0B0;line-height:1.8;margin:0;">
        BioVault（${company.name}）<br>
        TEL: ${company.phone} ／ MAIL: ${company.supportEmail}
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, bodyText, bodyHtml };
}

export function staffAccountCreatedEmail(name: string, loginId: string, password: string, scheme?: SchemeKey) {
  const company = getCompany(scheme);
  const subject = "【BioVault】従業員アカウントが発行されました";
  const bodyText = `${name} 様

BioVault 従業員アカウントが発行されました。
以下の情報でログインしてください。

────────────
ログインID: ${loginId}
パスワード: ${password}
────────────

ログインページ: https://member.biovault.jp/login

※ 初回ログイン後、パスワードの変更をお願いいたします。
※ ログインID・パスワードは第三者に知られないよう大切に管理してください。

ご不明な点がございましたら、下記までお気軽にお問い合わせください。

──────────────────
BioVault（${company.name}）
TEL: ${company.phone}
MAIL: ${company.supportEmail}
──────────────────`;

  const bodyHtml = `
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
      <p style="font-size:16px;color:#ffffff;margin:0 0 8px;">${name} 様</p>
      <p style="font-size:14px;color:#D5D5DE;line-height:1.8;margin:0 0 24px;">
        BioVault 従業員アカウントが発行されました。<br>
        以下の情報でログインしてください。
      </p>
      <div style="background:#1A1A22;border:1px solid #2A2A38;border-radius:6px;padding:20px;margin-bottom:24px;">
        <div style="font-size:11px;color:#A0A0B0;margin-bottom:4px;">ログインID</div>
        <div style="font-size:18px;color:#BFA04B;font-family:monospace;letter-spacing:2px;margin-bottom:16px;">${loginId}</div>
        <div style="font-size:11px;color:#A0A0B0;margin-bottom:4px;">パスワード</div>
        <div style="font-size:14px;color:#BFA04B;font-family:monospace;letter-spacing:1px;">${password}</div>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://member.biovault.jp/login" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#BFA04B,#8F7A3E);color:#070709;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:2px;border-radius:4px;">ログインページへ</a>
      </div>
      <p style="font-size:12px;color:#A0A0B0;line-height:1.8;margin:0;">
        ※ 初回ログイン後、パスワードの変更をお願いいたします。<br>
        ※ ログイン情報は第三者に知られないよう大切に管理してください。
      </p>
    </div>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #2A2A38;text-align:center;">
      <p style="font-size:12px;color:#A0A0B0;line-height:1.8;margin:0;">
        BioVault（${company.name}）<br>
        TEL: ${company.phone} ／ MAIL: ${company.supportEmail}
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, bodyText, bodyHtml };
}

export function agencyAccountCreatedEmail(name: string, loginId: string, password: string, scheme?: SchemeKey) {
  const company = getCompany(scheme);
  const subject = "【BioVault】エージェントアカウントが発行されました";
  const bodyText = `${name} 様

BioVault エージェントポータルへようこそ。
エージェントアカウントが発行されましたので、以下の情報でログインしてください。

────────────
ログインID: ${loginId}
パスワード: ${password}
────────────

ログインページ: https://member.biovault.jp/login

※ 初回ログイン後、パスワードの変更をお願いいたします。
※ ログインID・パスワードは第三者に知られないよう大切に管理してください。

ご不明な点がございましたら、下記までお気軽にお問い合わせください。

──────────────────
BioVault（${company.name}）
TEL: ${company.phone}
MAIL: ${company.supportEmail}
──────────────────`;

  const bodyHtml = `
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
      <p style="font-size:16px;color:#ffffff;margin:0 0 8px;">${name} 様</p>
      <p style="font-size:14px;color:#D5D5DE;line-height:1.8;margin:0 0 24px;">
        BioVault エージェントポータルへようこそ。<br>
        エージェントアカウントが発行されました。
      </p>
      <div style="background:#1A1A22;border:1px solid #2A2A38;border-radius:6px;padding:20px;margin-bottom:24px;">
        <div style="font-size:11px;color:#A0A0B0;margin-bottom:4px;">ログインID</div>
        <div style="font-size:18px;color:#BFA04B;font-family:monospace;letter-spacing:2px;margin-bottom:16px;">${loginId}</div>
        <div style="font-size:11px;color:#A0A0B0;margin-bottom:4px;">パスワード</div>
        <div style="font-size:14px;color:#BFA04B;font-family:monospace;letter-spacing:1px;">${password}</div>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="https://member.biovault.jp/login" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#BFA04B,#8F7A3E);color:#070709;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:2px;border-radius:4px;">ログインページへ</a>
      </div>
      <p style="font-size:12px;color:#A0A0B0;line-height:1.8;margin:0;">
        ※ 初回ログイン後、パスワードの変更をお願いいたします。<br>
        ※ ログイン情報は第三者に知られないよう大切に管理してください。
      </p>
    </div>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #2A2A38;text-align:center;">
      <p style="font-size:12px;color:#A0A0B0;line-height:1.8;margin:0;">
        BioVault（${company.name}）<br>
        TEL: ${company.phone} ／ MAIL: ${company.supportEmail}
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, bodyText, bodyHtml };
}

// ──────────────────────────────────────────────
// v2 お問い合わせメール
// ──────────────────────────────────────────────

/**
 * 管理者向け通知メール
 *  - 宛先: support@biovault.jp
 *  - 件名: 【BioVaultメンバーシップ】お問合せを承りました。XX XX様
 *  - 本文: 送信日時 / スキーム / 氏名 / メール / 内容
 */
export function contactInquiryAdminEmail(
  name: string,
  email: string,
  message: string,
  scheme?: SchemeKey,
  sentAt: Date = new Date()
) {
  const company = getCompany(scheme);
  const subject = `【BioVaultメンバーシップ】お問合せを承りました。${name}様`;
  const sentAtStr = sentAt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

  const bodyText = `BioVault メンバーシップサイトよりお問い合わせを受け付けました。

──────────────────
■ 送信日時
${sentAtStr}

■ スキーム
${company.shortName}(${company.name})

■ お名前
${name} 様

■ メールアドレス
${email}

■ お問い合わせ内容
${message}
──────────────────

※ このメールは自動送信されています。`;

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#FFFFFF;color:#1A1A1A;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <h1 style="font-size:18px;color:#1A1A1A;margin:0 0 24px;border-bottom:2px solid #F08301;padding-bottom:8px;">
      お問い合わせを受け付けました
    </h1>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1A1A1A;">
      <tr>
        <th style="text-align:left;padding:10px 12px;background:#F5F0E6;width:140px;border-bottom:1px solid #E5E0D5;">送信日時</th>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E0D5;">${sentAtStr}</td>
      </tr>
      <tr>
        <th style="text-align:left;padding:10px 12px;background:#F5F0E6;border-bottom:1px solid #E5E0D5;">スキーム</th>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E0D5;">${company.shortName}(${company.name})</td>
      </tr>
      <tr>
        <th style="text-align:left;padding:10px 12px;background:#F5F0E6;border-bottom:1px solid #E5E0D5;">お名前</th>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E0D5;">${escapeHtml(name)} 様</td>
      </tr>
      <tr>
        <th style="text-align:left;padding:10px 12px;background:#F5F0E6;border-bottom:1px solid #E5E0D5;">メール</th>
        <td style="padding:10px 12px;border-bottom:1px solid #E5E0D5;">${escapeHtml(email)}</td>
      </tr>
      <tr>
        <th style="text-align:left;padding:10px 12px;background:#F5F0E6;vertical-align:top;">お問い合わせ内容</th>
        <td style="padding:10px 12px;white-space:pre-wrap;">${escapeHtml(message)}</td>
      </tr>
    </table>
    <p style="font-size:11px;color:#888888;margin-top:24px;text-align:center;">
      ※ このメールは自動送信されています。
    </p>
  </div>
</body>
</html>`;

  return { subject, bodyText, bodyHtml };
}

/**
 * お問い合わせ送信者(顧客)向け自動返信メール
 *  - 宛先: 入力されたメールアドレス
 *  - 件名: 【BioVault】お問合せを承りました。
 */
export function contactInquiryCustomerEmail(name: string, message: string, scheme?: SchemeKey) {
  const company = getCompany(scheme);
  const subject = "【BioVault】お問合せを承りました。";

  const bodyText = `${name} 様

この度はBioVaultメンバーシップサイトへ
お問い合わせいただき、誠にありがとうございます。

下記の内容にてお問い合わせを承りました。
内容を確認の上、担当者より改めてご連絡させていただきます。

──────────────────
■ お問い合わせ内容
${message}
──────────────────

ご返信までしばらくお時間をいただく場合がございます。
何卒よろしくお願い申し上げます。


──────────────────
BioVault(${company.name})
TEL: ${company.phone}
MAIL: ${company.supportEmail}
〒${company.postalCode} ${company.address}
──────────────────

※ このメールは自動送信されています。
※ このメールに心当たりがない場合は、お手数ですが上記連絡先までご連絡ください。`;

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#FFFFFF;color:#1A1A1A;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-family:'Cormorant Garamond','Noto Serif JP',serif;font-size:28px;color:#1A1A1A;letter-spacing:0.04em;">BioVault</div>
      <div style="font-family:'Cormorant Garamond','Noto Serif JP',serif;font-size:14px;color:#888888;letter-spacing:0.2em;margin-top:4px;">Membership Service</div>
      <div style="width:60px;height:1px;background:linear-gradient(90deg,transparent,#F08301,transparent);margin:12px auto;"></div>
    </div>
    <div style="background:#FFFFFF;border:1px solid #F5A04A;border-radius:6px;padding:28px 24px;">
      <p style="font-size:16px;color:#1A1A1A;margin:0 0 20px;">${escapeHtml(name)} 様</p>
      <p style="font-size:14px;color:#4A4A4A;line-height:1.9;margin:0 0 16px;">
        この度はBioVaultメンバーシップサイトへお問い合わせいただき、誠にありがとうございます。
      </p>
      <p style="font-size:14px;color:#4A4A4A;line-height:1.9;margin:0 0 16px;">
        下記の内容にてお問い合わせを承りました。<br>
        内容を確認の上、担当者より改めてご連絡させていただきます。
      </p>
      <div style="background:#F5F0E6;border-left:3px solid #F08301;padding:14px 16px;margin:20px 0;">
        <div style="font-size:12px;color:#C26800;font-weight:700;margin-bottom:6px;">■ お問い合わせ内容</div>
        <div style="font-size:14px;color:#1A1A1A;line-height:1.8;white-space:pre-wrap;">${escapeHtml(message)}</div>
      </div>
      <p style="font-size:13px;color:#4A4A4A;line-height:1.8;margin:0;">
        ご返信までしばらくお時間をいただく場合がございます。何卒よろしくお願い申し上げます。
      </p>
    </div>
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid #EFEAE0;text-align:center;">
      <p style="font-size:12px;color:#888888;line-height:1.8;margin:0;">
        BioVault(${company.name})<br>
        TEL: ${company.phone} ／ MAIL: ${company.supportEmail}<br>
        〒${company.postalCode} ${company.address}
      </p>
      <p style="font-size:10px;color:#A0A0A0;margin-top:16px;">
        ※ このメールは自動送信されています。
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, bodyText, bodyHtml };
}

/**
 * LP経由の新規リード（ご紹介協力）の管理者向け通知メール
 *  - 宛先: 管理者・担当者（サーバー側で決定）
 *  - LPフォームから見込み顧客の登録があった際に送信
 */
export function affiliateLeadAdminEmail(lead: {
  name: string;
  nameKana: string;
  email: string;
  phone: string;
  postalCode?: string | null;
  address: string;
  occupation?: string | null;
  income?: string | null;
  createdAt?: Date;
}) {
  const createdAt = lead.createdAt ?? new Date();
  const createdAtStr = createdAt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  const title = "【ご紹介協力制度経由】iPS適合確認お申し込みLP";
  const subject = title;

  const bodyText = `${title}

受信日時: ${createdAtStr}
氏名: ${lead.name}
フリガナ：${lead.nameKana}
電話番号: ${lead.phone}
郵便番号: ${lead.postalCode || ""}
住所: ${lead.address}
メールアドレス: ${lead.email}
職業: ${lead.occupation || ""}
年収: ${lead.income || ""}`;

  return { subject, bodyText };
}

/**
 * LP経由の申込者(顧客)向け自動返信メール（テキストメール）
 *  - 宛先: 入力されたメールアドレス
 *  - 内容: LPサンクスページと同等（担当者より順次お電話でご連絡）
 */
export function affiliateLeadCustomerEmail(name: string, scheme?: SchemeKey) {
  const company = getCompany(scheme);
  const subject = "【BioVault】適合確認のお申込みを受け付けました";

  const bodyText = `${name} 様

この度は、iPS細胞作製の無料適合確認に
お申込みいただき、誠にありがとうございます。

お申込みの内容を確認のうえ、担当者より
順次お電話にてご連絡させていただきます。
恐れ入りますが、今しばらくお待ちくださいますよう
お願い申し上げます。

ご不明な点がございましたら、
下記までお気軽にお問い合わせください。


──────────────────
BioVault（${company.name}）
TEL: ${company.phone}
MAIL: ${company.supportEmail}
〒${company.postalCode} ${company.address}
──────────────────

※ このメールは自動送信されています。
※ このメールに心当たりがない場合は、お手数ですが上記連絡先までご連絡ください。`;

  return { subject, bodyText };
}

/** HTMLメール本文に入力値を埋め込む際の最低限のエスケープ */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function accountCreatedEmail(name: string, loginId: string, password: string, scheme?: SchemeKey) {
  const company = getCompany(scheme);
  const subject = "【BioVault】メンバーシップアカウントが発行されました";
  const bodyText = `${name} 様

BioVault メンバーシップサイトへようこそ。
会員アカウントが発行されましたので、以下の情報でログインしてください。

────────────
ログインID: ${loginId}
パスワード: ${password}
────────────

ログインページ: https://member.biovault.jp/login

※ 初回ログイン後、パスワードの変更をお願いいたします。
※ ログインID・パスワードは第三者に知られないよう大切に管理してください。

ご不明な点がございましたら、下記までお気軽にお問い合わせください。

──────────────────
BioVault（${company.name}）
TEL: ${company.phone}
MAIL: ${company.supportEmail}
──────────────────`;

  // 白ベース + ブランドグラデのHTMLメール(スマホ最適化 / テーブル+インラインCSS)
  //  - グラデは対応クライアントのみ表示。非対応(Outlook等)は background-color にフォールバック
  //  - ID/パスワードは画像でなくテキスト(画像ブロック時も確実に読める)
  const bodyHtml = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${subject}</title>
  <style>
    body { margin:0; padding:0; width:100% !important; }
    a { text-decoration:none; }
    @media only screen and (max-width:600px) {
      .fb-container { width:100% !important; }
      .fb-pad { padding-left:18px !important; padding-right:18px !important; }
      .fb-box-col { max-width:100% !important; margin-right:0 !important; }
      .fb-cred { margin-bottom:34px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f5f6f8;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f6f8;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <div class="fb-container" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 30px rgba(26,21,187,0.08);">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <!-- バナー(ブランドグラデ + テキストロゴ / 左寄せ・低め) -->
          <tr>
            <td align="left" style="background-color:#4f1ee6;background-image:linear-gradient(120deg,#5800FF 0%,#3a44d4 50%,#5CE1E6 100%);padding:22px 26px;text-align:left;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:500;color:#ffffff;letter-spacing:1px;line-height:1.1;">BioVault</div>
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:3px;color:#ffffff;opacity:0.9;margin-top:6px;">Membership Service</div>
            </td>
          </tr>
          <!-- 本文 -->
          <tr>
            <td class="fb-pad" style="padding:32px 28px 8px;font-family:'Helvetica Neue',Arial,'Hiragino Kaku Gothic ProN','Meiryo',sans-serif;">
              <p style="font-size:17px;color:#1a1a1a;margin:0 0 10px;font-weight:600;">${name} 様</p>
              <p style="font-size:14px;color:#4a4a4a;line-height:1.9;margin:0 0 24px;">
                BioVault メンバーシップへようこそ。<br>
                会員アカウントが発行されました。以下の情報でログインしてください。
              </p>
              <!-- ID/パスワード(テキスト) + 人物 / フルイドハイブリッド + direction:rtl:
                   PC=ID/パス左・人物右、SP=人物が上(中央)→ID/パスが下 に並ぶ。
                   DOMは人物→ボックスの順。direction:rtl でPCは右→左に並べ替え、
                   SPは縦積みで DOM順(人物が上) になる。 -->
              <div class="fb-cred" style="font-size:0;text-align:center;direction:rtl;margin:0;">
                <div style="display:inline-block;width:100%;max-width:200px;vertical-align:middle;direction:ltr;text-align:center;">
                  <img src="https://member.biovault.jp/nagashima02-mail.png" alt="" width="180" style="display:block;width:200px;max-width:100%;height:auto;margin:0 auto -20px;" />
                </div><div class="fb-box-col" style="display:inline-block;width:100%;max-width:280px;vertical-align:middle;direction:ltr;text-align:left;margin-right: 40px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f5fb;border:1px solid #e6e7f2;border-radius:10px;">
                    <tr>
                      <td style="padding:22px 20px;">
                        <div style="font-size:11px;color:#888888;letter-spacing:1px;margin-bottom:5px;">ログインID</div>
                        <div style="font-size:19px;color:#1A15BB;font-family:'Courier New',monospace;letter-spacing:2px;font-weight:700;margin-bottom:18px;">${loginId}</div>
                        <div style="font-size:11px;color:#888888;letter-spacing:1px;margin-bottom:5px;">パスワード</div>
                        <div style="font-size:16px;color:#1A15BB;font-family:'Courier New',monospace;letter-spacing:1px;font-weight:700;">${password}</div>
                      </td>
                    </tr>
                  </table>
                </div>
              </div>
              <!-- ボタン(ブランドグラデ) -->
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 24px;">
                <tr>
                  <td align="center" style="background-color:#5800FF;background-image:linear-gradient(90deg,#5800FF,#5CE1E6);border-radius:999px;">
                    <a href="https://member.biovault.jp/login" style="display:inline-block;padding:14px 40px;color:#ffffff;font-size:14px;font-weight:700;letter-spacing:2px;">ログインページへ</a>
                  </td>
                </tr>
              </table>
              <p style="font-size:12px;color:#888888;line-height:1.9;margin:0 0 24px;">
                ※ 初回ログイン後、パスワードの変更をお願いいたします。<br>
                ※ ログイン情報は第三者に知られないよう大切に管理してください。
              </p>
            </td>
          </tr>
          <!-- フッター -->
          <tr>
            <td class="fb-pad" style="padding:22px 28px 30px;border-top:1px solid #eeeef3;font-family:'Helvetica Neue',Arial,'Hiragino Kaku Gothic ProN','Meiryo',sans-serif;text-align:center;">
              <p style="font-size:12px;color:#888888;line-height:1.9;margin:0;">
                BioVault（${company.name}）<br>
                TEL: ${company.phone} ／ MAIL: ${company.supportEmail}
              </p>
              <p style="font-size:11px;color:#b0b0b8;letter-spacing:1px;margin:14px 0 0;">&copy; 2025 ${company.shortName} Inc. All Rights Reserved.</p>
            </td>
          </tr>
        </table>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, bodyText, bodyHtml };
}
