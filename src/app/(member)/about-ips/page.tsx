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

  const where: Record<string, unknown> = { isPublished: true };
  if (activeTab !== "all" && activeTab !== "knowledge" && CATEGORY_LABELS[activeTab]) {
    where.category = activeTab;
  }

  const articles = activeTab === "knowledge"
    ? []
    : await prisma.ipsArticle.findMany({
        where,
        orderBy: { publishedAt: "desc" },
      });

  // 注目記事（1件目）とそれ以外
  const featured = articles.length > 0 && activeTab === "all" ? articles[0] : null;
  const restArticles = featured ? articles.slice(1) : articles;

  return (
    <div>
      {/* タブ切り替え */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
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
      ) : articles.length === 0 ? (
        <EmptyState activeTab={activeTab} />
      ) : (
        <>
          {/* ──── ヒーロー記事（日経風: 左画像 + 右テキスト） ──── */}
          {featured && (
            <Link
              href={`/about-ips/news/${featured.slug}`}
              className="block mb-5 group"
            >
              <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden transition-all duration-300 hover:border-border-gold">
                <div className="flex flex-col sm:flex-row">
                  {/* 左: サムネイル */}
                  <div className="sm:w-[55%] shrink-0">
                    {featured.imageUrl ? (
                      <div className="w-full aspect-[16/9] sm:aspect-auto sm:h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={featured.imageUrl}
                          alt={featured.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-[16/9] sm:aspect-auto sm:h-full bg-bg-elevated flex items-center justify-center">
                        <span className="text-5xl opacity-20">📰</span>
                      </div>
                    )}
                  </div>
                  {/* 右: テキスト */}
                  <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2.5">
                      <CategoryBadge category={featured.category} />
                      {featured.sourceName && (
                        <span className="text-[10px] text-text-muted">
                          {featured.sourceName}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-medium text-text-primary leading-snug group-hover:text-gold transition-colors mb-3">
                      {featured.title}
                    </h2>
                    <p className="text-[12px] text-text-secondary leading-relaxed line-clamp-3 mb-3">
                      {featured.summary}
                    </p>
                    <div className="text-[10px] text-text-muted font-mono">
                      {new Date(featured.publishedAt).toLocaleDateString("ja-JP")}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* ──── 2カラムグリッド（日経風: テキスト左 + 画像右） ──── */}
          {restArticles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-0">
              {restArticles.map((article, i) => (
                <Link
                  key={article.id}
                  href={`/about-ips/news/${article.slug}`}
                  className="group"
                >
                  <div className={`flex gap-3 py-4 ${
                    i < restArticles.length - (restArticles.length % 2 === 0 ? 2 : 1)
                      ? "border-b border-border"
                      : ""
                  }`}>
                    {/* 左: テキスト */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] text-text-primary leading-snug group-hover:text-gold transition-colors line-clamp-2 font-medium mb-1.5">
                        {article.title}
                      </h3>
                      {/* 奇数番目（0始まり）のみ要約を表示 — 日経風に密度にバリエーション */}
                      {i % 3 === 0 && (
                        <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2 mb-1.5">
                          {article.summary}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <CategoryBadge category={article.category} small />
                        {article.sourceName && (
                          <span className="text-[10px] text-text-muted">{article.sourceName}</span>
                        )}
                      </div>
                    </div>
                    {/* 右: サムネイル */}
                    <div className="w-[90px] h-[68px] sm:w-[110px] sm:h-[80px] rounded overflow-hidden shrink-0 bg-bg-elevated">
                      {article.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={article.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl opacity-20">
                          {article.category === "RESEARCH" ? "🔬" : article.category === "CLINICAL" ? "🏥" : "📰"}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 空状態
function EmptyState({ activeTab }: { activeTab: string }) {
  return (
    <div className="bg-bg-secondary border border-border rounded-md p-12 text-center">
      <div className="text-2xl mb-3">📡</div>
      <p className="text-sm text-text-muted">
        {activeTab !== "all"
          ? `「${CATEGORY_LABELS[activeTab] || activeTab}」の記事はまだありません`
          : "記事はまだ投稿されていません"}
      </p>
      <p className="text-[11px] text-text-muted mt-1">最新情報は随時更新されます</p>
    </div>
  );
}

// 基礎知識セクション
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

function CategoryBadge({ category, small }: { category: string; small?: boolean }) {
  return (
    <span className={`${small ? "text-[9px] px-1.5 py-px" : "text-[10px] px-2 py-0.5"} rounded-full bg-gold/10 text-gold border border-gold/20`}>
      {CATEGORY_LABELS[category] || category}
    </span>
  );
}
