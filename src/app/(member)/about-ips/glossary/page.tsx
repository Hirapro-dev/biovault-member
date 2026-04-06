import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import GoldDivider from "@/components/ui/GoldDivider";

// カテゴリの日本語ラベル
const CATEGORY_LABELS: Record<string, string> = {
  basic: "基礎用語",
  medical: "医療応用",
  biovault: "BioVault 関連用語",
};

export default async function GlossaryPage() {
  await requireAuth();

  // DBから用語を取得
  const terms = await prisma.glossaryTerm.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  // カテゴリ別にグループ化
  const grouped: Record<string, typeof terms> = {};
  for (const t of terms) {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  }

  // カテゴリの表示順
  const categoryOrder = ["basic", "medical", "biovault"];
  const sortedCategories = Object.keys(grouped).sort(
    (a, b) => (categoryOrder.indexOf(a) === -1 ? 999 : categoryOrder.indexOf(a)) - (categoryOrder.indexOf(b) === -1 ? 999 : categoryOrder.indexOf(b))
  );

  return (
    <div className="max-w-[860px] mx-auto">
      {/* パンくず */}
      <div className="text-[11px] text-text-muted mb-6">
        <Link href="/dashboard" className="hover:text-gold transition-colors">
          トップ
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">用語集</span>
      </div>

      {/* ヘッダー */}
      <div className="text-center mb-12">
        <div className="text-4xl mb-4">📖</div>
        <h1 className="font-serif text-3xl font-light tracking-[3px] text-gold-gradient mb-3">
          Glossary
        </h1>
        <GoldDivider width={80} className="mx-auto mb-4" />
        <p className="font-serif-jp text-lg text-text-primary mb-2">用語集</p>
        <p className="text-[13px] text-text-secondary">
          iPS細胞・再生医療に関する専門用語をわかりやすく解説します
        </p>
      </div>

      {/* カテゴリ別用語 */}
      <div className="space-y-10">
        {sortedCategories.map((cat) => (
          <section key={cat}>
            <h2 className="font-serif-jp text-base font-normal text-gold tracking-wider mb-5 pb-3 border-b border-border">
              {CATEGORY_LABELS[cat] || cat}
            </h2>
            <div className="space-y-4">
              {grouped[cat].map((item) => (
                <div
                  key={item.id}
                  className="bg-bg-secondary border border-border rounded-md p-5 transition-colors duration-300 hover:border-border-gold"
                >
                  <div className="mb-2">
                    <h3 className="text-[15px] text-text-primary font-medium">
                      {item.term}
                    </h3>
                    {item.reading && (
                      <div className="text-[11px] text-text-muted mt-0.5">
                        {item.reading}
                      </div>
                    )}
                  </div>
                  <p className="text-[13px] text-text-secondary leading-[1.8]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}

        {terms.length === 0 && (
          <div className="text-center py-12 text-text-muted text-sm">
            用語はまだ登録されていません
          </div>
        )}
      </div>

      {/* 下部ナビゲーション */}
      <div className="mt-12 pt-8 border-t border-border flex justify-between">
        <Link
          href="/about-ips/history"
          className="text-sm text-text-secondary hover:text-gold transition-colors"
        >
          ← iPS細胞の歴史
        </Link>
        <Link
          href="/dashboard"
          className="text-sm text-gold hover:text-gold-light transition-colors"
        >
          トップへ戻る →
        </Link>
      </div>
    </div>
  );
}
