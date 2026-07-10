import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  AFFILIATE_COOKIE,
  AFFILIATE_COOKIE_MAX_AGE,
  clientIpFrom,
  hashIp,
} from "@/lib/affiliate";

// LPクリック計測 + 帰属Cookie発行（公開API）
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const ref = typeof body.ref === "string" ? body.ref.trim() : "";

    // AF-0000形式以外は無視（bot・改ざん対策）
    if (!/^AF-\d{4,}$/.test(ref)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const profile = await prisma.affiliateProfile.findUnique({
      where: { affiliateCode: ref },
      select: { id: true, status: true },
    });

    // 存在しない・停止中のコードは記録せずCookieも発行しない
    if (!profile || profile.status !== "ACTIVE") {
      return NextResponse.json({ ok: false }, { status: 404 });
    }

    // 同一IP×同一協力者の連続クリックは1分間隔でのみ記録（連打・リロード対策）
    const ipHash = hashIp(clientIpFrom(req));
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recent = ipHash
      ? await prisma.affiliateClick.findFirst({
          where: { affiliateProfileId: profile.id, ipHash, clickedAt: { gte: oneMinuteAgo } },
          select: { id: true },
        })
      : null;

    if (!recent) {
      await prisma.affiliateClick.create({
        data: {
          affiliateProfileId: profile.id,
          userAgent: (req.headers.get("user-agent") || "").slice(0, 500) || null,
          referer: typeof body.referer === "string" ? body.referer.slice(0, 500) : null,
          ipHash,
        },
      });
    }

    // 帰属Cookie（ラストクリック方式: 後から踏んだコードで上書き）
    const res = NextResponse.json({ ok: true });
    res.cookies.set(AFFILIATE_COOKIE, ref, {
      maxAge: AFFILIATE_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return res;
  } catch (e) {
    console.error("LP click error:", e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
