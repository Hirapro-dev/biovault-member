/**
 * Web Push通知の送信ライブラリ
 *
 * 環境変数:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY  - VAPID公開鍵（クライアントで使用）
 *   VAPID_PRIVATE_KEY             - VAPID秘密鍵（サーバーで使用）
 *   VAPID_EMAIL                   - VAPID連絡先メール
 *
 * VAPID鍵の生成: npx web-push generate-vapid-keys
 */

import webpush from "web-push";
import prisma from "./prisma";

// VAPID設定
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:info@biovault.jp";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

/**
 * 全登録済みユーザーにプッシュ通知を送信
 */
export async function sendPushToAll({
  title,
  body,
  url,
}: {
  title: string;
  body: string;
  url?: string;
}) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn("VAPID鍵が設定されていません。プッシュ通知はスキップされます。");
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await prisma.pushSubscription.findMany();
  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify({ title, body, url: url || "/dashboard" })
      );
      sent++;
    } catch (error: unknown) {
      failed++;
      // 410 Gone = サブスクリプションが無効 → 削除
      if (error && typeof error === "object" && "statusCode" in error && (error as { statusCode: number }).statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
  }

  return { sent, failed };
}
