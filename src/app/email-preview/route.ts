/**
 * /email-preview （開発用・ローカル限定）
 *
 * accountCreatedEmail のHTMLをブラウザで確認するためのプレビュールート。
 * - サンプルデータで描画（実メールは送信しません）。
 * - 画像URLを localhost 配信(相対パス)へ差し替えてローカルでも画像が表示されます。
 * - 本番(VERCEL_ENV=production)のみ404。プレビュー/ローカルでは表示可能。
 *
 * 使い方: ローカル http://localhost:3000/email-preview / プレビューURL/email-preview
 */

import { accountCreatedEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // 本番デプロイ(VERCEL_ENV=production)でのみ無効化。プレビュー・ローカルは表示可。
  if (process.env.VERCEL_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(request.url);
  // デフォルトは MRT スキーム想定。?scheme=SCPP で SCPP に切替可能。
  const scheme = url.searchParams.get("scheme") === "SCPP" ? "SCPP" : "MRT";

  const { bodyHtml } = accountCreatedEmail(
    "山田 太郎",
    "tanaka0001",
    "Xy7k9mPq",
    scheme,
  );

  // メール本番は絶対URL(member.biovault.jp)を参照するため、
  // ローカル確認用にローカル配信(相対パス)へ差し替える。
  const html = bodyHtml.split("https://member.biovault.jp/").join("/");

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
