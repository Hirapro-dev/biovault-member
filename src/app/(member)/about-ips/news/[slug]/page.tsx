import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import GoldDivider from "@/components/ui/GoldDivider";
import { notFound } from "next/navigation";

const CATEGORY_LABELS: Record<string, string> = {
  NEWS: "ニュース",
  RESEARCH: "研究動向",
  CLINICAL: "臨床応用",
  REGULATION: "制度・規制",
  MARKET: "市場動向",
};

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireAuth();
  const { slug } = await params;

  const article = await prisma.ipsArticle.findUnique({
    where: { slug },
  });

  if (!article || !article.isPublished) {
    notFound();
  }

  return (
    <div className="max-w-[760px] mx-auto">
      {/* パンくず */}
      <div className="text-[11px] text-text-muted mb-6">
        <Link href="/about-ips" className="hover:text-gold transition-colors">
          About iPS
        </Link>
        <span className="mx-2">/</span>
        <Link href="/about-ips/news" className="hover:text-gold transition-colors">
          ニュース
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">記事</span>
      </div>

      {/* 記事ヘッダー */}
      <article>
        <div className="mb-8">
          {/* サムネイル画像 */}
          {article.imageUrl && (
            <div className="w-full aspect-[2/1] rounded-lg overflow-hidden mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
              {CATEGORY_LABELS[article.category] || article.category}
            </span>
            <span className="text-[11px] text-text-muted font-mono">
              {new Date(article.publishedAt).toLocaleDateString("ja-JP")}
            </span>
          </div>
          <h1 className="font-serif-jp text-2xl font-normal text-text-primary tracking-wide leading-relaxed mb-4">
            {article.title}
          </h1>
          <GoldDivider width={60} className="mb-4" />
          <p className="text-sm text-text-secondary leading-relaxed">
            {article.summary}
          </p>
        </div>

        {/* 記事本文 */}
        <div className="bg-bg-secondary border border-border rounded-md p-8">
          <div
            className="prose-dark text-sm text-text-primary leading-[2] space-y-4"
            dangerouslySetInnerHTML={{
              __html: article.content
                .split("\n\n")
                .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
                .join(""),
            }}
          />
        </div>

        {/* ソース */}
        {article.sourceUrl && (
          <div className="mt-6 p-4 bg-bg-secondary border border-border rounded-md">
            <div className="text-[11px] text-text-muted mb-1">出典・参考</div>
            <div className="text-[13px] text-text-secondary">
              {article.sourceName && (
                <span className="mr-2">{article.sourceName}</span>
              )}
              <span className="text-gold-dark font-mono text-[11px] break-all">
                {article.sourceUrl}
              </span>
            </div>
          </div>
        )}

        {/* 著者 */}
        <div className="mt-4 text-right text-[11px] text-text-muted">
          投稿者: {article.author}
        </div>
      </article>

      {/* ナビゲーション */}
      <div className="mt-10 pt-6 border-t border-border">
        <Link
          href="/about-ips/news"
          className="text-sm text-text-secondary hover:text-gold transition-colors"
        >
          ← ニュース一覧に戻る
        </Link>
      </div>
    </div>
  );
}
