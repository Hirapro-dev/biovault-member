import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import MobileNav from "@/components/layout/MobileNav";
import BottomNav from "@/components/layout/BottomNav";
import AccessLogger from "@/components/analytics/AccessLogger";
import PushRegistrar from "@/components/analytics/PushRegistrar";
import InstallGuide from "@/components/ui/InstallGuide";
import TestControlPanel from "@/components/ui/TestControlPanel";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  // セッション（JWT）から同意状態を取得（DBクエリ不要）
  const hasAgreedTerms = (user as any).hasAgreedTerms !== false;

  // 署名済み書類のタイプを取得（トグルメニュー用）
  const signedDocs = await prisma.document.findMany({
    where: { userId: user.id, status: "SIGNED" },
    select: { type: true },
  });
  const signedDocTypes = signedDocs.map((d) => d.type);

  // 未同意時はメニューバーを非表示（重要事項説明ページ用）
  if (!hasAgreedTerms) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary font-sans">
        <main className="px-4 py-8 sm:py-12 max-w-[800px] mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans">
      <div className="flex-1 overflow-y-auto relative w-full">
        {/* ハンバーガーナビ（PC・モバイル共通） */}
        <MobileNav isAdmin={false} userName={user.name} signedDocTypes={signedDocTypes} showOnAllScreens />

        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-8 pb-24 lg:pb-8 max-w-[1200px] mx-auto animate-fade-in">
          {children}
        </main>

        {/* モバイル: 下部固定ナビ */}
        <BottomNav />

        {/* アクセスログ自動記録 */}
        <AccessLogger />

        {/* プッシュ通知登録 */}
        <PushRegistrar />

        {/* ホーム画面追加ガイド */}
        <InstallGuide />

        {/* テスト操作パネル（テスターアカウントのみ表示） */}
        <TestControlPanel />
      </div>
    </div>
  );
}
