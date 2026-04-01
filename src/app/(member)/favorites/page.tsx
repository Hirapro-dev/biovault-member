import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";

const CATEGORY_LABELS: Record<string, string> = {
  NEWS: "ニュース",
  RESEARCH: "研究動向",
  CLINICAL: "臨床応用",
  REGULATION: "制度・規制",
  MARKET: "市場動向",
};

export default async function FavoritesPage() {
  const user = await requireAuth();

  // お気に入り一覧を取得
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // お気に入りのコンテンツをIDで取得
  const articleIds = favorites.filter((f) => f.contentType === "ARTICLE").map((f) => f.contentId);
  const videoIds = favorites.filter((f) => f.contentType === "VIDEO").map((f) => f.contentId);
  const newsIds = favorites.filter((f) => f.contentType === "EXTERNAL_NEWS").map((f) => f.contentId);

  const [articles, videos, externalNews] = await Promise.all([
    articleIds.length > 0
      ? prisma.ipsArticle.findMany({ where: { id: { in: articleIds }, isPublished: true } })
      : [],
    videoIds.length > 0
      ? prisma.video.findMany({ where: { id: { in: videoIds }, isPublished: true } })
      : [],
    newsIds.length > 0
      ? prisma.externalNews.findMany({ where: { id: { in: newsIds }, isPublished: true } })
      : [],
  ]);

  const totalCount = articles.length + videos.length + externalNews.length;

  return (
    <div>
      <h2 className="font-serif-jp text-lg font-normal text-text-primary tracking-wider mb-5">
        お気に入り
      </h2>

      {totalCount === 0 ? (
        <div className="bg-bg-secondary border border-border rounded-md p-12 text-center">
          <div className="text-3xl mb-3">☆</div>
          <p className="text-sm text-text-muted mb-2">お気に入りはまだありません</p>
          <p className="text-[11px] text-text-muted">
            記事や動画の ★ ボタンをタップしてお気に入りに追加できます
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 自社記事 */}
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/about-ips/news/${article.slug}`}
              className="flex gap-3 bg-bg-secondary border border-border rounded-md p-4 hover:border-border-gold transition-all group"
            >
              {article.imageUrl ? (
                <div className="w-[100px] shrink-0">
                  <div className="w-full aspect-[16/9] rounded overflow-hidden bg-bg-elevated">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              ) : null}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] px-1.5 py-px rounded-full bg-gold/10 text-gold border border-gold/20">
                    {CATEGORY_LABELS[article.category] || article.category}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">
                    {new Date(article.publishedAt).toLocaleDateString("ja-JP")}
                  </span>
                </div>
                <h3 className="text-[13px] text-text-primary leading-snug group-hover:text-gold transition-colors line-clamp-2">
                  {article.title}
                </h3>
              </div>
            </Link>
          ))}

          {/* 動画 */}
          {videos.map((video) => (
            <Link
              key={video.id}
              href={`/about-ips?tab=videos`}
              className="flex gap-3 bg-bg-secondary border border-border rounded-md p-4 hover:border-border-gold transition-all group"
            >
              {video.thumbnailUrl ? (
                <div className="w-[100px] shrink-0">
                  <div className="w-full aspect-[16/9] rounded overflow-hidden bg-bg-elevated">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              ) : null}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] px-1.5 py-px rounded-full bg-gold/10 text-gold border border-gold/20">
                    動画
                  </span>
                </div>
                <h3 className="text-[13px] text-text-primary leading-snug group-hover:text-gold transition-colors line-clamp-2">
                  {video.title}
                </h3>
              </div>
            </Link>
          ))}

          {/* 外部ニュース */}
          {externalNews.map((news) => (
            <a
              key={news.id}
              href={news.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 bg-bg-secondary border border-border rounded-md p-4 hover:border-border-gold transition-all group"
            >
              {news.imageUrl ? (
                <div className="w-[100px] shrink-0">
                  <div className="w-full aspect-[16/9] rounded overflow-hidden bg-bg-elevated">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={news.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              ) : null}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] px-1.5 py-px rounded-full bg-status-info/10 text-status-info border border-status-info/20">
                    {news.sourceName}
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">
                    {new Date(news.publishedAt).toLocaleDateString("ja-JP")}
                  </span>
                </div>
                <h3 className="text-[13px] text-text-primary leading-snug group-hover:text-gold transition-colors line-clamp-2">
                  {news.title}
                </h3>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
