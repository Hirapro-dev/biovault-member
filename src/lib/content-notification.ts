import prisma from "./prisma";
import { sendPushToAll } from "./push-notification";

/**
 * コンテンツ更新通知を作成するヘルパー
 * 記事・動画・ニュースが公開されたときに呼び出す
 * - DBに通知レコードを保存（ログイン時ポップアップ用）
 * - 全登録ユーザーにプッシュ通知を送信（スマホ通知用）
 */
export async function createContentUpdate({
  title,
  contentType,
  contentId,
  linkUrl,
}: {
  title: string;
  contentType: "article" | "video" | "news" | "status";
  contentId?: string;
  linkUrl?: string;
}) {
  try {
    // DB保存（ログイン時ポップアップ用）
    await prisma.contentUpdate.create({
      data: {
        title,
        contentType,
        contentId: contentId || null,
        linkUrl: linkUrl || null,
      },
    });
  } catch (e) {
    console.error("ContentUpdate作成エラー（テーブル未作成の可能性）:", e);
  }

  // プッシュ通知送信（非同期・エラーは無視）
  sendPushToAll({
    title: "BioVault - 新着コンテンツ",
    body: title,
    url: linkUrl || "/dashboard",
  }).catch(() => {});
}
