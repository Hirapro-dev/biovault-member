import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

/**
 * 同意ログAPI
 * 免責事項への同意を詳細ログとして記録
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();

  // ヘッダーから技術情報を取得
  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
    || headersList.get("x-real-ip")
    || "unknown";
  const userAgent = headersList.get("user-agent") || "unknown";

  // ユーザー情報を取得
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { membership: { select: { ipsStatus: true } } },
  });

  if (!user) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  try {
    // 同意ログを記録
    await prisma.consentLog.create({
      data: {
        userId,
        memberEmail: user.email,
        membershipStatus: user.membership?.ipsStatus || "UNKNOWN",
        documentId: body.documentId,
        documentTitle: body.documentTitle,
        documentVersion: body.documentVersion,
        documentUrl: body.documentUrl || null,
        consentTextVersion: body.consentTextVersion,
        consentTextSnapshot: body.consentTextSnapshot,
        consentAction: "agreed",
        popupDisplayedAt: body.popupDisplayedAt ? new Date(body.popupDisplayedAt) : null,
        consentedAt: new Date(),
        viewStartedAt: body.viewStartedAt ? new Date(body.viewStartedAt) : null,
        ipAddress,
        userAgent,
        sessionId: body.sessionId || null,
      },
    });

    // パンフレット同意の場合、ユーザーフラグも更新
    if (body.documentId === "pamphlet-v1") {
      await prisma.user.update({
        where: { id: userId },
        data: {
          hasAgreedPamphlet: true,
          agreedPamphletAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("同意ログ記録エラー:", error);
    return NextResponse.json({ error: "同意の記録に失敗しました" }, { status: 500 });
  }
}

// GET: 自分の同意ログ取得
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const logs = await prisma.consentLog.findMany({
    where: { userId },
    orderBy: { consentedAt: "desc" },
  });

  return NextResponse.json(logs);
}
