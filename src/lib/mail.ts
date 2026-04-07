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

const ses = new SESClient({
  region: process.env.AWS_SES_REGION || "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_SES_ACCESS_KEY || "",
    secretAccessKey: process.env.AWS_SES_SECRET_KEY || "",
  },
});

const FROM_EMAIL = process.env.EMAIL_FROM || "support@biovault.jp";
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

export function applicationReceivedEmail(name: string) {
  const subject = "【BioVault】お申込みを受け付けました";
  const bodyText = `${name} 様

BioVault メンバーシップへのお申込みをいただき、誠にありがとうございます。

お申込み内容を確認のうえ、担当者より改めてご連絡させていただきます。
通常、1〜3営業日以内にご連絡いたします。

ご不明な点がございましたら、下記までお気軽にお問い合わせください。

──────────────────
BioVault（株式会社SCPP）
TEL: 0120-788-839
MAIL: info@biovault.jp
〒107-6012 東京都港区赤坂1-12-32 アークヒルズ 森ビル12F
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
      <div style="font-size:24px;font-weight:300;letter-spacing:4px;color:#BFA04B;">BioVault</div>
      <div style="width:60px;height:1px;background:linear-gradient(90deg,transparent,#BFA04B,transparent);margin:12px auto;"></div>
    </div>
    <div style="background:#111116;border:1px solid #2A2A38;border-radius:8px;padding:32px 24px;">
      <p style="font-size:16px;color:#ffffff;margin:0 0 24px;">${name} 様</p>
      <p style="font-size:14px;color:#D5D5DE;line-height:1.8;margin:0 0 16px;">
        BioVault メンバーシップへのお申込みをいただき、誠にありがとうございます。
      </p>
      <p style="font-size:14px;color:#D5D5DE;line-height:1.8;margin:0 0 16px;">
        お申込み内容を確認のうえ、担当者より改めてご連絡させていただきます。<br>
        通常、1〜3営業日以内にご連絡いたします。
      </p>
      <p style="font-size:14px;color:#D5D5DE;line-height:1.8;margin:0;">
        ご不明な点がございましたら、お気軽にお問い合わせください。
      </p>
    </div>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #2A2A38;text-align:center;">
      <p style="font-size:12px;color:#A0A0B0;line-height:1.8;margin:0;">
        BioVault（株式会社SCPP）<br>
        TEL: 0120-788-839 ／ MAIL: info@biovault.jp<br>
        〒107-6012 東京都港区赤坂1-12-32 アークヒルズ 森ビル12F
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

export function accountCreatedEmail(name: string, loginId: string, password: string) {
  const subject = "【BioVault】会員アカウントが発行されました";
  const bodyText = `${name} 様

BioVault メンバーシップへようこそ。
会員アカウントが発行されましたので、以下の情報でログインしてください。

────────────
ログインID: ${loginId}
パスワード: ${password}
────────────

ログインページ: https://biovault-member.vercel.app/login

※ 初回ログイン後、パスワードの変更をお願いいたします。
※ ログインID・パスワードは第三者に知られないよう大切に管理してください。

ご不明な点がございましたら、下記までお気軽にお問い合わせください。

──────────────────
BioVault（株式会社SCPP）
TEL: 0120-788-839
MAIL: info@biovault.jp
──────────────────`;

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#070709;color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:24px;font-weight:300;letter-spacing:4px;color:#BFA04B;">BioVault</div>
      <div style="width:60px;height:1px;background:linear-gradient(90deg,transparent,#BFA04B,transparent);margin:12px auto;"></div>
    </div>
    <div style="background:#111116;border:1px solid #2A2A38;border-radius:8px;padding:32px 24px;">
      <p style="font-size:16px;color:#ffffff;margin:0 0 8px;">${name} 様</p>
      <p style="font-size:14px;color:#D5D5DE;line-height:1.8;margin:0 0 24px;">
        BioVault メンバーシップへようこそ。<br>
        会員アカウントが発行されました。
      </p>
      <div style="background:#1A1A22;border:1px solid #2A2A38;border-radius:6px;padding:20px;margin-bottom:24px;">
        <div style="font-size:11px;color:#A0A0B0;margin-bottom:4px;">ログインID</div>
        <div style="font-size:18px;color:#BFA04B;font-family:monospace;letter-spacing:2px;margin-bottom:16px;">${loginId}</div>
        <div style="font-size:11px;color:#A0A0B0;margin-bottom:4px;">パスワード</div>
        <div style="font-size:14px;color:#BFA04B;font-family:monospace;letter-spacing:1px;">${password}</div>
      </div>
      <p style="font-size:12px;color:#A0A0B0;line-height:1.8;margin:0;">
        ※ 初回ログイン後、パスワードの変更をお願いいたします。<br>
        ※ ログイン情報は第三者に知られないよう大切に管理してください。
      </p>
    </div>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #2A2A38;text-align:center;">
      <p style="font-size:12px;color:#A0A0B0;line-height:1.8;margin:0;">
        BioVault（株式会社SCPP）<br>
        TEL: 0120-788-839 ／ MAIL: info@biovault.jp
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, bodyText, bodyHtml };
}
