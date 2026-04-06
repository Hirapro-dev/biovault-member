import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import { GlossaryForm, GlossaryEditButton, GlossaryDeleteButton, CategoryBadge } from "./GlossaryActions";

export default async function AdminGlossaryPage() {
  await requireAdmin();

  const terms = await prisma.glossaryTerm.findMany({
    orderBy: [
      { category: "asc" },
      { sortOrder: "asc" },
    ],
  });

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        用語集管理
      </h2>

      {/* 新規作成フォーム */}
      <GlossaryForm />

      {/* 用語一覧 */}
      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {terms.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">用語はまだ登録されていません</div>
        ) : (
          <>
            {/* PC: テーブル */}
            <div className="hidden sm:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {["用語名", "読み", "英語名", "カテゴリ", "表示順", ""].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {terms.map((t) => (
                    <tr key={t.id} className="border-b border-border hover:bg-bg-elevated transition-colors">
                      <td className="px-4 py-3 text-sm text-text-primary font-medium">{t.term}</td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{t.reading || "---"}</td>
                      <td className="px-4 py-3 text-xs text-text-secondary italic">{t.english || "---"}</td>
                      <td className="px-4 py-3">
                        <CategoryBadge category={t.category} />
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted font-mono">{t.sortOrder}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <GlossaryEditButton glossaryTerm={{
                            id: t.id,
                            term: t.term,
                            reading: t.reading,
                            english: t.english,
                            description: t.description,
                            category: t.category,
                            sortOrder: t.sortOrder,
                          }} />
                          <GlossaryDeleteButton id={t.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* モバイル: カードリスト */}
            <div className="sm:hidden divide-y divide-border">
              {terms.map((t) => (
                <div key={t.id} className="px-4 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-primary font-medium">{t.term}</span>
                    <CategoryBadge category={t.category} />
                  </div>
                  <div className="text-[11px] text-text-muted mb-1">
                    {t.reading && <span>{t.reading}</span>}
                    {t.reading && t.english && <span> ・ </span>}
                    {t.english && <span className="italic">{t.english}</span>}
                  </div>
                  <div className="text-xs text-text-secondary mb-3 line-clamp-2">{t.description}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-text-muted font-mono">順序: {t.sortOrder}</span>
                    <div className="flex gap-1.5">
                      <GlossaryEditButton glossaryTerm={{
                        id: t.id,
                        term: t.term,
                        reading: t.reading,
                        english: t.english,
                        description: t.description,
                        category: t.category,
                        sortOrder: t.sortOrder,
                      }} />
                      <GlossaryDeleteButton id={t.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
