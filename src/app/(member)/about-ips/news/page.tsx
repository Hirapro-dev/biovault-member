import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import GoldDivider from "@/components/ui/GoldDivider";

const CATEGORY_LABELS: Record<string, string> = {
  NEWS: "ニュース",
  RESEARCH: "研究動向",
  CLINICAL: "臨床応用",
  REGULATION: "制度・規制",
  MARKET: "市場動向",
};

export default async function NewsListPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requireAuth();
  const { category } = await searchParams;

  const where: Record<string, unknown> = { isPublished: true };
  if (category) {
    where.category = category;
  }

  const articles = await prisma.ipsArticle.findMany({
    where,
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="max-w-[860px] mx-auto">
      {/* パンくず */}
      <div className="text-[11px] text-text-muted mb-6">
        <Link href="/about-ips" className="hover:text-gold transition-colors">
          About iPS
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">ニュース</span>
      </div>

      {/* ヘッダー */}
      <div className="text-center mb-10">
        <div className="text-4xl mb-4">📡</div>
        <h1 className="font-serif text-3xl font-light tracking-[3px] text-gold-gradient mb-3">
          iPS News
        </h1>
        <GoldDivider width={80} className="mx-auto mb-4" />
        <p className="text-[13px] text-text-secondary">
          iPS細胞に関する最新ニュースと研究動向
        </p>
      </div>

      {/* カテゴリフィルタ */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <Link
          href="/about-ips/news"
          className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
            !category
              ? "bg-gold/10 text-gold border-gold/20"
              : "bg-transparent text-text-muted border-border hover:border-border-gold hover:text-gold"
          }`}
        >
          すべて
        </Link>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <Link
            key={key}
            href={`/about-ips/news?category=${key}`}
            className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${
              category === key
                ? "bg-gold/10 text-gold border-gold/20"
                : "bg-transparent text-text-muted border-border hover:border-border-gold hover:text-gold"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* 記事一覧 */}
      {articles.length > 0 ? (
        <div className="space-y-4">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/about-ips/news/${article.slug}`}
              className="block bg-bg-secondary border border-border rounded-md p-6 transition-all duration-300 hover:border-border-gold group"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
                  {CATEGORY_LABELS[article.category] || article.category}
                </span>
                <span className="text-[11px] text-text-muted font-mono">
                  {new Date(article.publishedAt).toLocaleDateString("ja-JP")}
                </span>
                {article.sourceName && (
                  <span className="text-[11px] text-text-muted">
                    — {article.sourceName}
                  </span>
                )}
              </div>
              <h2 className="text-[15px] text-text-primary group-hover:text-gold transition-colors mb-1.5">
                {article.title}
              </h2>
              <p className="text-[13px] text-text-secondary leading-relaxed line-clamp-2">
                {article.summary}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-bg-secondary border border-border rounded-md p-16 text-center">
          <div className="text-3xl mb-4">📡</div>
          <p className="text-sm text-text-muted mb-2">
            {category
              ? `「${CATEGORY_LABELS[category] || category}」カテゴリの記事はまだありません`
              : "ニュース記事はまだ投稿されていません"}
          </p>
          <p className="text-[11px] text-text-muted">
            最新情報は随時更新されます
          </p>
        </div>
      )}
    </div>
  );
}
