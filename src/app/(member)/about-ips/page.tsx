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

// タブ定義（「すべて」+ 基礎知識 + カテゴリ）
const TABS = [
  { key: "all", label: "すべて" },
  { key: "knowledge", label: "基礎知識" },
  { key: "NEWS", label: "ニュース" },
  { key: "RESEARCH", label: "研究動向" },
  { key: "CLINICAL", label: "臨床応用" },
];

export default async function AboutIpsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAuth();
  const { tab } = await searchParams;
  const activeTab = tab || "all";

  // 記事を取得
  const where: Record<string, unknown> = { isPublished: true };
  if (activeTab !== "all" && activeTab !== "knowledge" && CATEGORY_LABELS[activeTab]) {
    where.category = activeTab;
  }

  const articles = activeTab === "knowledge"
    ? [] // 基礎知識タブは静的コンテンツ
    : await prisma.ipsArticle.findMany({
        where,
        orderBy: { publishedAt: "desc" },
      });

  // 注目記事（最新の公開記事1件をピン留め）
  const featuredArticle = activeTab === "knowledge"
    ? null
    : await prisma.ipsArticle.findFirst({
        where: { isPublished: true },
        orderBy: { publishedAt: "desc" },
      });

  return (
    <div>
      {/* タブ切り替え */}
      <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "all" ? "/about-ips" : `/about-ips?tab=${t.key}`}
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

      {/* 基礎知識タブ */}
      {activeTab === "knowledge" ? (
        <KnowledgeSection />
      ) : (
        <>
          {/* 注目コンテンツ（ピン留め記事） */}
          {featuredArticle && activeTab === "all" && (
            <Link
              href={`/about-ips/news/${featuredArticle.slug}`}
              className="block mb-6 group"
            >
              <div className="relative bg-bg-secondary border border-border rounded-lg overflow-hidden transition-all duration-300 hover:border-border-gold">
                {featuredArticle.imageUrl ? (
                  <div className="relative w-full aspect-[2/1] sm:aspect-[3/1]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={featuredArticle.imageUrl}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 via-bg-primary/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30 backdrop-blur-sm">
                          📌 注目
                        </span>
                        <CategoryBadge category={featuredArticle.category} />
                        <span className="text-[11px] text-white/60 font-mono">
                          {new Date(featuredArticle.publishedAt).toLocaleDateString("ja-JP")}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg text-white font-medium leading-snug group-hover:text-gold transition-colors">
                        {featuredArticle.title}
                      </h2>
                      <p className="text-[12px] text-white/70 mt-1.5 line-clamp-2 hidden sm:block">
                        {featuredArticle.summary}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/30">
                        📌 注目
                      </span>
                      <CategoryBadge category={featuredArticle.category} />
                      <span className="text-[11px] text-text-muted font-mono">
                        {new Date(featuredArticle.publishedAt).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg text-text-primary font-medium leading-snug group-hover:text-gold transition-colors">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-[12px] text-text-secondary mt-1.5 line-clamp-2">
                      {featuredArticle.summary}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          )}

          {/* ニュースタイムライン */}
          <div className="space-y-3">
            {articles.length > 0 ? (
              articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/about-ips/news/${article.slug}`}
                  className="flex gap-4 bg-bg-secondary border border-border rounded-md p-4 transition-all duration-300 hover:border-border-gold group"
                >
                  {/* サムネイル */}
                  {article.imageUrl ? (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-md overflow-hidden shrink-0 bg-bg-elevated">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={article.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-md shrink-0 bg-bg-elevated flex items-center justify-center text-2xl">
                      {article.category === "RESEARCH" ? "🔬" : article.category === "CLINICAL" ? "🏥" : article.category === "NEWS" ? "📰" : "📋"}
                    </div>
                  )}

                  {/* コンテンツ */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <CategoryBadge category={article.category} />
                      <span className="text-[10px] text-text-muted font-mono">
                        {new Date(article.publishedAt).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                    <h3 className="text-[13px] sm:text-sm text-text-primary leading-snug group-hover:text-gold transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-[11px] text-text-muted mt-1 line-clamp-1 hidden sm:block">
                      {article.summary}
                    </p>
                    {article.sourceName && (
                      <div className="text-[10px] text-text-muted mt-1">
                        {article.sourceName}
                      </div>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="bg-bg-secondary border border-border rounded-md p-12 text-center">
                <div className="text-2xl mb-3">📡</div>
                <p className="text-sm text-text-muted">
                  {activeTab !== "all"
                    ? `「${CATEGORY_LABELS[activeTab] || activeTab}」の記事はまだありません`
                    : "記事はまだ投稿されていません"}
                </p>
                <p className="text-[11px] text-text-muted mt-1">
                  最新情報は随時更新されます
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// 基礎知識セクション（静的コンテンツカード）
function KnowledgeSection() {
  const items = [
    {
      href: "/about-ips/what-is-ips",
      icon: "🧬",
      title: "iPS細胞とは？",
      description: "人工多能性幹細胞の仕組みと可能性、再生医療・創薬への応用について",
    },
    {
      href: "/about-ips/history",
      icon: "📜",
      title: "iPS細胞の歴史",
      description: "1962年の核移植実験から2026年の世界初承認まで、60年以上の軌跡",
    },
    {
      href: "/about-ips/glossary",
      icon: "📖",
      title: "用語集",
      description: "iPS細胞・再生医療に関する専門用語をわかりやすく解説",
    },
  ];

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-4 bg-bg-secondary border border-border rounded-md p-5 transition-all duration-300 hover:border-border-gold group"
        >
          <div className="w-14 h-14 rounded-lg bg-bg-elevated flex items-center justify-center text-2xl shrink-0">
            {item.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-sm text-text-primary group-hover:text-gold transition-colors font-medium">
              {item.title}
            </h3>
            <p className="text-[12px] text-text-secondary mt-1 leading-relaxed">
              {item.description}
            </p>
          </div>
          <span className="text-text-muted group-hover:text-gold transition-colors">→</span>
        </Link>
      ))}
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
      {CATEGORY_LABELS[category] || category}
    </span>
  );
}
