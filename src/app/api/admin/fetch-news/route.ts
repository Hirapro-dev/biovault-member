import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * 外部ニュース自動取得API（Google News RSS経由）
 * iPS細胞・再生医療関連のニュースを取得してDBに保存
 *
 * 管理者が手動で実行するか、Vercel Cronで定期実行
 */

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

  // シンプルなXMLパーサー（正規表現ベース）
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

function extractTag(xml: string, tag: string): string | null {
  // CDATAセクション対応
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

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  try {
    // 複数のクエリでiPS関連ニュースを取得
    const queries = [
      "iPS細胞",
      "再生医療 iPS",
      "幹細胞 治療",
    ];

    let totalFetched = 0;
    let totalSaved = 0;

    for (const query of queries) {
      const items = await fetchGoogleNewsRss(query);
      totalFetched += items.length;

      for (const item of items) {
        // 重複チェック（sourceUrlがユニーク）
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
            },
          });
          totalSaved++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      fetched: totalFetched,
      saved: totalSaved,
      message: `${totalFetched}件取得、${totalSaved}件を新規保存しました`,
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
    take: 50,
  });

  return NextResponse.json(news);
}
