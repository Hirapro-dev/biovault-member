import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import GoldDivider from "@/components/ui/GoldDivider";

export default async function AboutIpsPage() {
  await requireAuth();

  // 最新のニュース記事を3件取得
  const latestArticles = await prisma.ipsArticle.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  return (
    <div>
      {/* ヒーローセクション */}
      <div className="text-center mb-12">
        <div className="text-[11px] tracking-[6px] text-gold-dark mb-3">ABOUT</div>
        <h1 className="font-serif text-4xl font-light tracking-[4px] text-gold-gradient mb-3">
          iPS Cells
        </h1>
        <GoldDivider width={80} className="mx-auto mb-4" />
        <p className="text-sm text-text-secondary leading-relaxed max-w-[600px] mx-auto">
          iPS細胞の基礎知識から最新の研究動向まで。
          <br />
          あなたの「細胞資産」をより深く理解するための情報をお届けします。
        </p>
      </div>

      {/* ナビゲーションカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
        <NavCard
          href="/about-ips/what-is-ips"
          icon="🧬"
          title="iPS細胞とは？"
          description="人工多能性幹細胞の仕組みと可能性、再生医療・創薬への応用について"
        />
        <NavCard
          href="/about-ips/history"
          icon="📜"
          title="iPS細胞の歴史"
          description="1962年の核移植実験から2026年の世界初承認まで、60年以上の軌跡"
        />
        <NavCard
          href="/about-ips/glossary"
          icon="📖"
          title="用語集"
          description="iPS細胞・再生医療に関する専門用語をわかりやすく解説"
        />
      </div>

      {/* 最新ニュース */}
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <h2 className="font-serif-jp text-base font-normal text-text-primary tracking-wider">
            iPS 最新ニュース
          </h2>
          <Link
            href="/about-ips/news"
            className="text-[11px] text-gold hover:text-gold-light transition-colors"
          >
            すべて見る →
          </Link>
        </div>

        {latestArticles.length > 0 ? (
          <div className="flex flex-col gap-3">
            {latestArticles.map((article) => (
              <Link
                key={article.id}
                href={`/about-ips/news/${article.slug}`}
                className="bg-bg-secondary border border-border rounded-md px-6 py-5 flex items-center justify-between transition-all duration-300 hover:border-border-gold group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <CategoryBadge category={article.category} />
                    <span className="text-[11px] text-text-muted font-mono">
                      {new Date(article.publishedAt).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                  <h3 className="text-sm text-text-primary group-hover:text-gold transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-[11px] text-text-secondary mt-1 line-clamp-1">
                    {article.summary}
                  </p>
                </div>
                <span className="text-text-muted group-hover:text-gold transition-colors ml-4">
                  →
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-bg-secondary border border-border rounded-md p-12 text-center">
            <div className="text-2xl mb-3">📡</div>
            <p className="text-sm text-text-muted">
              最新ニュースは近日公開予定です
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function NavCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="bg-bg-secondary border border-border rounded-md p-7 transition-all duration-300 hover:border-border-gold group block"
    >
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="font-serif-jp text-base font-normal text-text-primary group-hover:text-gold transition-colors mb-2">
        {title}
      </h3>
      <p className="text-[12px] text-text-secondary leading-relaxed">
        {description}
      </p>
      <div className="mt-4 text-[11px] text-gold opacity-0 group-hover:opacity-100 transition-opacity">
        詳しく見る →
      </div>
    </Link>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const labels: Record<string, string> = {
    NEWS: "ニュース",
    RESEARCH: "研究動向",
    CLINICAL: "臨床応用",
    REGULATION: "制度・規制",
    MARKET: "市場動向",
  };
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
      {labels[category] || category}
    </span>
  );
}
