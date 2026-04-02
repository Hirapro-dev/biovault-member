import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { getSourceLogo } from "@/lib/source-logos";

const CATEGORY_LABELS: Record<string, string> = {
  NEWS: "ニュース",
  RESEARCH: "研究動向",
  CLINICAL: "臨床応用",
  REGULATION: "制度・規制",
  MARKET: "市場動向",
};

const CONTENT_TABS = [
  { key: "featured", label: "注目ニュース" },
  { key: "videos", label: "動画" },
  { key: "news", label: "RSS" },
  { key: "knowledge", label: "基礎知識" },
];

// 各タブの紹介文
const TAB_DESCRIPTIONS: Record<string, { icon: string; text: string }> = {
  featured: {
    icon: "📰",
    text: "BioVaultが厳選した、iPS細胞・再生医療に関する注目のトピックスをお届けします。最新の研究成果や臨床応用の進展など、押さえておきたい情報をまとめています。",
  },
  videos: {
    icon: "🎬",
    text: "iPS細胞や再生医療について、わかりやすく解説した動画コンテンツをご覧いただけます。専門的な内容も映像で直感的に理解できます。",
  },
  news: {
    icon: "📡",
    text: "世の中のiPS細胞に関する情報を集約しています。クリックすると情報元ページにリンクしていますので気になるニュースがありましたら、ご確認ください。",
  },
  knowledge: {
    icon: "📖",
    text: "iPS細胞の基本から応用まで、体系的に学べるコンテンツを揃えています。はじめての方も、より深く知りたい方も、ぜひご活用ください。",
  },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await requireAuth();
  const { tab } = await searchParams;
  const activeTab = tab || "featured";

  // ── コンテンツ + お気に入りを並列取得（高速化） ──
  const [articles, videos, externalNews, favorites] = await Promise.all([
    activeTab === "featured"
      ? prisma.ipsArticle.findMany({ where: { isPublished: true }, orderBy: { publishedAt: "desc" } })
      : Promise.resolve([]),
    activeTab === "videos"
      ? prisma.video.findMany({ where: { isPublished: true }, orderBy: { publishedAt: "desc" } })
      : Promise.resolve([]),
    activeTab === "news"
      ? prisma.externalNews.findMany({ where: { isPublished: true }, orderBy: { publishedAt: "desc" }, take: 30 })
      : Promise.resolve([]),
    prisma.favorite.findMany({
      where: { userId: user.id },
      select: { contentType: true, contentId: true },
    }),
  ]);
  const favSet = new Set(favorites.map((f) => `${f.contentType}:${f.contentId}`));

  const featured = articles.length > 0 && activeTab === "featured" ? articles[0] : null;
  const restArticles = featured ? articles.slice(1) : articles;

  return (
    <div>
      {/* タブ切り替え */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {CONTENT_TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "featured" ? "/dashboard" : `/dashboard?tab=${t.key}`}
            className={`shrink-0 text-[12px] px-4 py-2 rounded-full border transition-all ${
              activeTab === t.key
                ? "bg-gold/15 text-gold border-gold/30 font-medium"
                : "bg-transparent text-text-muted border-border hover:border-border-gold hover:text-text-secondary"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* タブ紹介文 */}
      {TAB_DESCRIPTIONS[activeTab] && (
        <div className="flex items-start gap-3 mb-6 bg-bg-secondary border border-border rounded-md p-4">
          <span className="text-xl shrink-0 mt-0.5">{TAB_DESCRIPTIONS[activeTab].icon}</span>
          <p className="text-[12px] sm:text-[13px] text-text-secondary leading-relaxed">
            {TAB_DESCRIPTIONS[activeTab].text}
          </p>
        </div>
      )}

      {/* ── 注目ニュース ── */}
      {activeTab === "featured" && (
        <>
          {articles.length === 0 ? (
            <EmptyState label="注目ニュース" />
          ) : (
            <>
              {featured && (
                <div className="relative mb-4">
                  <Link href={`/about-ips/news/${featured.slug}`} className="block group">
                    <div className="flex flex-col sm:flex-row sm:gap-5">
                      <div className="sm:w-[55%] shrink-0">
                        {featured.imageUrl ? (
                          <div className="w-full aspect-[16/9] overflow-hidden rounded-md sm:rounded-lg">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={featured.imageUrl} alt={featured.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-full aspect-[16/9] bg-bg-elevated rounded-md sm:rounded-lg flex items-center justify-center">
                            <span className="text-5xl opacity-15">📰</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 pt-3 sm:pt-0 sm:flex sm:flex-col sm:justify-center">
                        <div className="flex items-center gap-2 mb-2">
                          <CategoryBadge category={featured.category} />
                          {featured.sourceName && <span className="text-[10px] text-text-muted">{featured.sourceName}</span>}
                        </div>
                        <h2 className="text-[17px] sm:text-lg font-bold text-text-primary leading-snug group-hover:text-gold transition-colors mb-2 pr-8">
                          {featured.title}
                        </h2>
                        <p className="text-[12px] text-text-secondary leading-relaxed line-clamp-3 hidden sm:block">{featured.summary}</p>
                      </div>
                    </div>
                  </Link>
                  <div className="absolute top-3 right-0 sm:top-auto sm:bottom-0 sm:right-0">
                    <FavoriteButton contentType="ARTICLE" contentId={featured.id} isFavorited={favSet.has(`ARTICLE:${featured.id}`)} />
                  </div>
                </div>
              )}
              <ArticleList articles={restArticles} favSet={favSet} />
            </>
          )}
        </>
      )}

      {/* ── 動画 ── */}
      {activeTab === "videos" && (
        <>
          {videos.length === 0 ? (
            <EmptyState label="動画" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {videos.map((video) => (
                <Link key={video.id} href={`/about-ips/video/${video.id}`} className="group">
                  <div className="aspect-video rounded-md overflow-hidden bg-bg-elevated mb-2 relative">
                    {video.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🎬</div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                        <span className="text-bg-primary text-sm ml-0.5">▶</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-[13px] text-text-primary group-hover:text-gold transition-colors leading-snug line-clamp-2 font-medium">
                    {video.title.length > 24 ? video.title.slice(0, 24) + "..." : video.title}
                  </h3>
                  <div className="text-[10px] text-text-muted font-mono mt-1">
                    {new Date(video.publishedAt).toLocaleDateString("ja-JP")}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── ニュース ── */}
      {activeTab === "news" && (
        <>
          {externalNews.length === 0 ? (
            <EmptyState label="RSS" />
          ) : (
            <div>
              {externalNews.map((news, i) => (
                <div key={news.id} className={`py-4 ${i < externalNews.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="flex gap-3">
                    <a href={news.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex gap-3 flex-1 min-w-0 group">
                      <div className="w-[120px] sm:w-[130px] shrink-0">
                        <div className="w-full aspect-[16/9] rounded overflow-hidden bg-bg-elevated flex items-center justify-center">
                          {news.imageUrl && !news.imageUrl.includes("google.com/s2/favicons") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={news.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : getSourceLogo(news.sourceName) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={getSourceLogo(news.sourceName)!} alt={news.sourceName} className="w-16 h-16 object-contain" />
                          ) : (
                            <span className="text-[11px] text-text-muted font-medium text-center px-2 leading-tight">
                              {news.sourceName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[14px] sm:text-[13px] text-text-primary leading-snug group-hover:text-gold transition-colors font-medium line-clamp-3">{news.title}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[9px] px-1.5 py-px rounded-full bg-status-info/10 text-status-info border border-status-info/20">{news.sourceName}</span>
                          <span className="text-[10px] text-text-muted font-mono">{new Date(news.publishedAt).toLocaleDateString("ja-JP")}</span>
                        </div>
                      </div>
                    </a>
                    <FavoriteButton contentType="EXTERNAL_NEWS" contentId={news.id} isFavorited={favSet.has(`EXTERNAL_NEWS:${news.id}`)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── 基礎知識 ── */}
      {activeTab === "knowledge" && <KnowledgeSection />}
    </div>
  );
}

// ── コンテンツ用コンポーネント ──

function ArticleList({ articles, favSet }: { articles: { id: string; slug: string; title: string; summary: string; imageUrl: string | null; category: string; sourceName: string | null; publishedAt: Date }[]; favSet: Set<string> }) {
  if (articles.length === 0) return null;

  return (
    <>
      {/* スマホ版 */}
      <div className="block sm:hidden">
        {articles.map((article, i) => (
          <div key={article.id} className={`py-4 ${i < articles.length - 1 ? "border-b border-border" : ""}`}>
            <div className="flex gap-3">
              <Link href={`/about-ips/news/${article.slug}`} className="flex gap-3 flex-1 min-w-0 group">
                {article.imageUrl && (
                  <div className="w-[120px] shrink-0">
                    <div className="w-full aspect-[16/9] rounded overflow-hidden bg-bg-elevated">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] text-text-primary leading-snug group-hover:text-gold transition-colors font-medium line-clamp-3">{article.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <CategoryBadge category={article.category} small />
                    {article.sourceName && <span className="text-[10px] text-text-muted">{article.sourceName}</span>}
                  </div>
                </div>
              </Link>
              <FavoriteButton contentType="ARTICLE" contentId={article.id} isFavorited={favSet.has(`ARTICLE:${article.id}`)} />
            </div>
          </div>
        ))}
      </div>

      {/* PC版 */}
      <div className="hidden sm:grid sm:grid-cols-2 gap-x-6 gap-y-0">
        {articles.map((article, i) => (
          <div key={article.id} className={`py-4 ${i < articles.length - (articles.length % 2 === 0 ? 2 : 1) ? "border-b border-border" : ""}`}>
            <div className="flex gap-3">
              <Link href={`/about-ips/news/${article.slug}`} className="flex gap-3 flex-1 min-w-0 group">
                {article.imageUrl && (
                  <div className="w-[130px] shrink-0">
                    <div className="w-full aspect-[16/9] rounded overflow-hidden bg-bg-elevated">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] text-text-primary leading-snug group-hover:text-gold transition-colors line-clamp-2 font-medium mb-1.5">{article.title}</h3>
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={article.category} small />
                    {article.sourceName && <span className="text-[10px] text-text-muted">{article.sourceName}</span>}
                  </div>
                </div>
              </Link>
              <FavoriteButton contentType="ARTICLE" contentId={article.id} isFavorited={favSet.has(`ARTICLE:${article.id}`)} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="bg-bg-secondary border border-border rounded-md p-12 text-center">
      <div className="text-2xl mb-3">📡</div>
      <p className="text-sm text-text-muted">「{label}」はまだ投稿されていません</p>
      <p className="text-[11px] text-text-muted mt-1">最新情報は随時更新されます</p>
    </div>
  );
}

function KnowledgeSection() {
  const items = [
    { href: "/about-ips/what-is-ips", icon: "🧬", title: "iPS細胞とは？", description: "人工多能性幹細胞の仕組みと可能性、再生医療・創薬への応用について" },
    { href: "/about-ips/history", icon: "📜", title: "iPS細胞の歴史", description: "1962年の核移植実験から2026年の世界初承認まで、60年以上の軌跡" },
    { href: "/about-ips/glossary", icon: "📖", title: "用語集", description: "iPS細胞・再生医療に関する専門用語をわかりやすく解説" },
  ];

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="flex items-center gap-4 bg-bg-secondary border border-border rounded-md p-5 transition-all duration-300 hover:border-border-gold group">
          <div className="w-14 h-14 rounded-lg bg-bg-elevated flex items-center justify-center text-2xl shrink-0">{item.icon}</div>
          <div className="flex-1">
            <h3 className="text-sm text-text-primary group-hover:text-gold transition-colors font-medium">{item.title}</h3>
            <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">{item.description}</p>
          </div>
          <span className="text-text-muted group-hover:text-gold transition-colors">→</span>
        </Link>
      ))}
    </div>
  );
}

function CategoryBadge({ category, small }: { category: string; small?: boolean }) {
  return (
    <span className={`inline-block ${small ? "text-[9px] px-1.5 py-px" : "text-[10px] px-2 py-0.5"} rounded-full bg-gold/10 text-gold border border-gold/20`}>
      {CATEGORY_LABELS[category] || category}
    </span>
  );
}
