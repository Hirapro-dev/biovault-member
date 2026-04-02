import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createContentUpdate } from "@/lib/content-notification";

/**
 * 外部ニュース自動取得API（Google News RSS経由）
 * iPS細胞・再生医療関連のニュースを取得 + OGP画像を自動取得してDBに保存
 */

export const maxDuration = 60;

interface RssItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

// Google News RSSからiPS関連ニュースを取得
async function fetchGoogleNewsRss(query: string): Promise<RssItem[]> {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ja&gl=JP&ceid=JP:ja`;

  const res = await fetch(rssUrl, {
    headers: { "User-Agent": "BioVault-News-Fetcher/1.0" },
  });

  if (!res.ok) {
    throw new Error(`RSS取得失敗: ${res.status}`);
  }

  const xml = await res.text();

  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = extractTag(itemXml, "title");
    const link = extractTag(itemXml, "link");
    const source = extractTag(itemXml, "source");
    const pubDate = extractTag(itemXml, "pubDate");

    if (title && link) {
      items.push({
        title: decodeHtmlEntities(title),
        link,
        source: source ? decodeHtmlEntities(source) : "不明",
        pubDate: pubDate || new Date().toISOString(),
      });
    }
  }

  return items;
}

// 記事ページからOGP画像を取得
async function fetchOgpImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "BioVault-OGP-Fetcher/1.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(5000), // 5秒タイムアウト
    });

    if (!res.ok) return null;

    const html = await res.text();

    // og:image を取得
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);

    if (ogMatch) return ogMatch[1];

    // twitter:image を取得（フォールバック）
    const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);

    if (twMatch) return twMatch[1];

    return null;
  } catch {
    return null;
  }
}

function extractTag(xml: string, tag: string): string | null {
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[(.+?)\\]\\]></${tag}>`);
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1];

  const regex = new RegExp(`<${tag}[^>]*>(.+?)</${tag}>`);
  const match = xml.match(regex);
  return match ? match[1] : null;
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

// POST: ニュース取得実行（高速版 — OGP画像取得なし、RSS即保存）
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  try {
    // RSS取得（1クエリに絞って高速化）
    const items = await fetchGoogleNewsRss("iPS細胞 OR 再生医療");
    let totalSaved = 0;

    for (const item of items) {
      const exists = await prisma.externalNews.findUnique({
        where: { sourceUrl: item.link },
      });

      if (!exists) {
        await prisma.externalNews.create({
          data: {
            title: item.title,
            sourceUrl: item.link,
            sourceName: item.source,
            publishedAt: new Date(item.pubDate),
            isPublished: false,
          },
        });
        totalSaved++;
      }
    }

    return NextResponse.json({
      success: true,
      fetched: items.length,
      saved: totalSaved,
      message: `${items.length}件取得、${totalSaved}件を新規保存しました`,
    });
  } catch (error) {
    console.error("ニュース取得エラー:", error);
    const message = error instanceof Error ? error.message : "不明なエラー";
    return NextResponse.json({ error: `ニュース取得に失敗: ${message}` }, { status: 500 });
  }
}

// GET: 外部ニュース一覧取得
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const news = await prisma.externalNews.findMany({
    orderBy: { publishedAt: "desc" },
    take: 100,
  });

  return NextResponse.json(news);
}

// PATCH: 公開/非公開切り替え
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }

  // 更新前の公開状態を取得
  const before = await prisma.externalNews.findUnique({ where: { id: body.id }, select: { isPublished: true } });

  const news = await prisma.externalNews.update({
    where: { id: body.id },
    data: { isPublished: body.isPublished },
  });

  // 非公開→公開に切り替わった場合、更新通知を作成
  if (!before?.isPublished && news.isPublished) {
    await createContentUpdate({
      title: `RSSニュースを更新しました`,
      contentType: "news",
      contentId: news.id,
      linkUrl: "/dashboard?tab=news",
    });
  }

  return NextResponse.json(news);
}
