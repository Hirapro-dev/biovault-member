import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const maxDuration = 15;

/**
 * 個別ニュース記事の詳細取得API
 * プレビュー時にOGP情報（画像・要約）を1件だけ取得してDBを更新
 * OGP画像が取れない場合は媒体のファビコン（ロゴ）を使用
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await params;

  const news = await prisma.externalNews.findUnique({ where: { id } });
  if (!news) {
    return NextResponse.json({ error: "記事が見つかりません" }, { status: 404 });
  }

  // 既に要約と画像がある場合はそのまま返す
  if (news.summary && news.imageUrl) {
    return NextResponse.json(news);
  }

  // 元記事ページからOGP情報を取得
  try {
    // Google Newsリダイレクトを解決して実際のURLを取得
    const actualUrl = await resolveRedirect(news.sourceUrl);
    const ogpData = await fetchOgpData(actualUrl);

    // DB更新（OGP画像が取れた場合のみ画像を更新）
    const updated = await prisma.externalNews.update({
      where: { id },
      data: {
        summary: ogpData.description || news.summary,
        imageUrl: ogpData.image || news.imageUrl,
      },
    });

    return NextResponse.json(updated);
  } catch {
    // OGP取得失敗してもエラーにせず、現在のデータを返す
    return NextResponse.json(news);
  }
}

/**
 * リダイレクトを解決して実際のURLを取得
 * Google Newsの記事リンクはリダイレクトされるため
 */
async function resolveRedirect(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: { "User-Agent": "BioVault-OGP-Fetcher/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    return res.url || url;
  } catch {
    return url;
  }
}

// OGP情報を取得
async function fetchOgpData(url: string): Promise<{ description: string | null; image: string | null }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BioVault/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return { description: null, image: null };

    const html = await res.text();

    // og:description
    const descMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)
      || html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);

    // og:image
    const imgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
      || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);

    return {
      description: descMatch ? decodeHtmlEntities(descMatch[1]) : null,
      image: imgMatch ? imgMatch[1] : null,
    };
  } catch {
    return { description: null, image: null };
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}
