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

      {activeTab === "knowledge" ? (
        <KnowledgeSection />
      ) : articles.length === 0 ? (
        <EmptyState activeTab={activeTab} />
      ) : (
        <>
          {/* ══════ ヒーロー記事 ══════ */}
          {/* スマホ: 画像上 → テキスト下（縦積み） */}
          {/* PC: 左画像 + 右テキスト（横並び） */}
          {featured && (
            <Link
              href={`/about-ips/news/${featured.slug}`}
              className="block mb-4 group"
            >
              {/* 画像（スマホ: 全幅、PC: 左55%） */}
              <div className="flex flex-col sm:flex-row sm:gap-5">
                <div className="sm:w-[55%] shrink-0">
                  {featured.imageUrl ? (
                    <div className="w-full aspect-[16/9] overflow-hidden rounded-md sm:rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={featured.imageUrl}
                        alt={featured.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[16/9] bg-bg-elevated rounded-md sm:rounded-lg flex items-center justify-center">
                      <span className="text-5xl opacity-15">📰</span>
                    </div>
                  )}
                </div>
                {/* テキスト */}
                <div className="flex-1 pt-3 sm:pt-0 sm:flex sm:flex-col sm:justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <CategoryBadge category={featured.category} />
                    {featured.sourceName && (
                      <span className="text-[10px] text-text-muted">{featured.sourceName}</span>
                    )}
                  </div>
                  <h2 className="text-[17px] sm:text-lg font-bold text-text-primary leading-snug group-hover:text-gold transition-colors mb-2">
                    {featured.title}
                  </h2>
                  <p className="text-[12px] text-text-secondary leading-relaxed line-clamp-3 hidden sm:block">
                    {featured.summary}
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* ══════ 記事リスト ══════ */}
          {/* スマホ: 1カラム（日経スマホアプリ風） */}
          {/* PC: 2カラム */}
          {restArticles.length > 0 && (
            <>
              {/* ── スマホ版（1カラム） ── */}
              <div className="block sm:hidden">
                {restArticles.map((article, i) => (
                  <Link
                    key={article.id}
                    href={`/about-ips/news/${article.slug}`}
                    className="group"
                  >
                    <div className={`py-4 ${i < restArticles.length - 1 ? "border-b border-border" : ""}`}>
                      {article.imageUrl ? (
                        /* 画像あり: 画像左（16:9） + テキスト右 */
                        <div className="flex gap-3">
                          <div className="w-[120px] shrink-0">
                            <div className="w-full aspect-[16/9] rounded overflow-hidden bg-bg-elevated">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={article.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[14px] text-text-primary leading-snug group-hover:text-gold transition-colors font-medium line-clamp-3">
                              {article.title}
                            </h3>
                            {i % 4 === 0 && (
                              <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2 mt-1">
                                {article.summary}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <CategoryBadge category={article.category} small />
                              {article.sourceName && (
                                <span className="text-[10px] text-text-muted">{article.sourceName}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* 画像なし: テキストのみ */
                        <div>
                          <h3 className="text-[14px] text-text-primary leading-snug group-hover:text-gold transition-colors font-medium">
                            {article.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <CategoryBadge category={article.category} small />
                            {article.sourceName && (
                              <span className="text-[10px] text-text-muted">{article.sourceName}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* ── PC版（2カラム） ── */}
              <div className="hidden sm:grid sm:grid-cols-2 gap-x-6 gap-y-0">
                {restArticles.map((article, i) => (
                  <Link
                    key={article.id}
                    href={`/about-ips/news/${article.slug}`}
                    className="group"
                  >
                    <div className={`py-4 ${
                      i < restArticles.length - (restArticles.length % 2 === 0 ? 2 : 1)
                        ? "border-b border-border"
                        : ""
                    }`}>
                      {article.imageUrl ? (
                        <div className="flex gap-3">
                          {/* 画像左（16:9） */}
                          <div className="w-[130px] shrink-0">
                            <div className="w-full aspect-[16/9] rounded overflow-hidden bg-bg-elevated">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={article.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          {/* テキスト右 */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[13px] text-text-primary leading-snug group-hover:text-gold transition-colors line-clamp-2 font-medium mb-1.5">
                              {article.title}
                            </h3>
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
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-[13px] text-text-primary leading-snug group-hover:text-gold transition-colors line-clamp-2 font-medium mb-1.5">
                            {article.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <CategoryBadge category={article.category} small />
                            {article.sourceName && (
                              <span className="text-[10px] text-text-muted">{article.sourceName}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

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

function CategoryBadge({ category, small, className }: { category: string; small?: boolean; className?: string }) {
  return (
    <span className={`inline-block ${small ? "text-[9px] px-1.5 py-px" : "text-[10px] px-2 py-0.5"} rounded-full bg-gold/10 text-gold border border-gold/20 ${className || ""}`}>
      {CATEGORY_LABELS[category] || category}
    </span>
  );
}
