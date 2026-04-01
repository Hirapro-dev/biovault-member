import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import BottomNav from "@/components/layout/BottomNav";
import AccessLogger from "@/components/analytics/AccessLogger";

export const dynamic = "force-dynamic";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  // 未同意かどうかをDBから確認（キャッシュなし）
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { hasAgreedTerms: true },
  });

  // 未同意時はメニューバーを非表示（重要事項説明ページ用）
  if (!fullUser?.hasAgreedTerms) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary font-sans">
        <main className="px-4 py-8 sm:py-12 max-w-[800px] mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary font-sans">
      {/* PC: サイドバー */}
      <div className="hidden lg:block">
        <Sidebar isAdmin={false} />
      </div>

      <div className="flex-1 overflow-y-auto relative w-full">
        {/* モバイル: ハンバーガーナビ */}
        <MobileNav isAdmin={false} userName={user.name} />

        {/* PC: ヘッダー */}
        <div className="hidden lg:block">
          <Header userName={user.name} isAdmin={isAdmin} />
        </div>

        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-8 pb-24 lg:pb-8 max-w-[1200px] mx-auto animate-fade-in">
          {children}
        </main>

        {/* モバイル: 下部固定ナビ */}
        <BottomNav />

        {/* アクセスログ自動記録 */}
        <AccessLogger />
      </div>
    </div>
  );
}
