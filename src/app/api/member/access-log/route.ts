import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * アクセスログ記録API
 * 会員のページ閲覧を記録
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ ok: true }); // 未ログインは無視
  }

  const userId = (session.user as any).id;
  const body = await req.json();

  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
    || headersList.get("x-real-ip")
    || "unknown";
  const userAgent = headersList.get("user-agent") || "unknown";
  const referer = headersList.get("referer") || null;

  try {
    await prisma.accessLog.create({
      data: {
        userId,
        path: body.path || "/",
        pageTitle: body.pageTitle || null,
        ipAddress,
        userAgent,
        referer,
      },
    });
  } catch {
    // ログ記録失敗してもユーザー体験に影響させない
  }

  return NextResponse.json({ ok: true });
}
