import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { notifyIpsStatusChange } from "@/lib/status-notification";

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

  // 書類タイプのラベルマッピング
  const DOC_LABELS: Record<string, string> = {
    CELL_STORAGE_CONSENT: "細胞提供・保管同意書",
    INFORMED_CONSENT: "iPS細胞作製における事前説明・同意",
  };

  try {
    const docType = body.documentType || body.documentId || "unknown";
    const docLabel = DOC_LABELS[docType] || body.documentTitle || docType;

    // 同意ログを記録
    await prisma.consentLog.create({
      data: {
        userId,
        memberEmail: user.email,
        membershipStatus: user.membership?.ipsStatus || "UNKNOWN",
        documentId: body.documentId || docType,
        documentTitle: body.documentTitle || docLabel,
        documentVersion: body.documentVersion || "1.0",
        documentUrl: body.documentUrl || null,
        consentTextVersion: body.consentTextVersion || "1.0",
        consentTextSnapshot: body.consentTextSnapshot || `${docLabel}に同意`,
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

    // 書類タイプ指定の場合、書類ステータスをSIGNEDに更新
    const docTypeMap: Record<string, string> = {
      CELL_STORAGE_CONSENT: "CELL_STORAGE_CONSENT",
      INFORMED_CONSENT: "INFORMED_CONSENT",
    };
    if (docTypeMap[docType]) {
      await prisma.document.updateMany({
        where: { userId, type: docTypeMap[docType] as any, status: { not: "SIGNED" } },
        data: { status: "SIGNED", signedAt: new Date() },
      });
    }

    // 細胞提供・保管同意書の場合、死亡時意思表示を保存
    if (docType === "CELL_STORAGE_CONSENT" && body.deathWish) {
      await prisma.membership.updateMany({
        where: { userId },
        data: { deathWish: body.deathWish },
      });
    }

    // 同意通知（細胞提供・保管同意 / iPS細胞作製事前説明・同意）
    const notifyDocTypes: Record<string, string> = {
      CELL_STORAGE_CONSENT: "DOC_CELL_CONSENT",
      INFORMED_CONSENT: "DOC_INFORMED",
    };
    const notifyKey = notifyDocTypes[docType];
    if (notifyKey) {
      try {
        const memberInfo = await prisma.membership.findUnique({
          where: { userId },
          select: { memberNumber: true },
        });
        await notifyIpsStatusChange({
          userId,
          memberName: user.name || "会員",
          memberNumber: memberInfo?.memberNumber,
          fromStatus: user.membership?.ipsStatus || "---",
          toStatus: notifyKey,
          changedBy: "会員本人",
          note: `${docLabel}に同意`,
        });
      } catch (e) {
        console.error("Consent notification error:", e);
      }
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
