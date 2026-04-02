import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * プッシュ通知サブスクリプション登録API
 * POST: ブラウザのPush Subscriptionを保存
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未認証です" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { subscription } = await req.json();

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: "無効なサブスクリプションです" }, { status: 400 });
  }

  // 既存のサブスクリプションがあれば更新、なければ作成
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      userId,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    create: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });

  return NextResponse.json({ success: true });
}

/**
 * プッシュ通知サブスクリプション解除API
 * DELETE: endpointを指定してサブスクリプションを削除
 */
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未認証です" }, { status: 401 });
  }

  const { endpoint } = await req.json();

  if (!endpoint) {
    return NextResponse.json({ error: "endpointが必要です" }, { status: 400 });
  }

  // 該当のサブスクリプションを削除
  await prisma.pushSubscription.deleteMany({
    where: { endpoint },
  });

  return NextResponse.json({ success: true });
}
