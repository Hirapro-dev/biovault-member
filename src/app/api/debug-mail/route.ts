import { NextResponse } from "next/server";

/**
 * デバッグ用: メールテンプレートのHTMLを確認するAPI
 * 本番では削除すること
 */
export async function GET() {
  const testHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#070709;color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://biovault-member.vercel.app/logo.png" alt="BioVault" style="height:40px;width:auto;" />
    </div>
    <p style="color:#fff;">This is a test. If you see the logo above, the URL is correct.</p>
    <p style="color:#BFA04B;">Deploy timestamp: ${new Date().toISOString()}</p>
  </div>
</body>
</html>`;

  return new NextResponse(testHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
