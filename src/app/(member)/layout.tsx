import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";
import BottomNav from "@/components/layout/BottomNav";
import AccessLogger from "@/components/analytics/AccessLogger";
import PushRegistrar from "@/components/analytics/PushRegistrar";
import InstallGuide from "@/components/ui/InstallGuide";
import TestControlPanel from "@/components/ui/TestControlPanel";
import { isEmailAllowedToDuplicate } from "@/lib/email-duplicate";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  // セッション（JWT）から同意状態を取得（DBクエリ不要）
  const hasAgreedTerms = (user as { hasAgreedTerms?: boolean }).hasAgreedTerms !== false;

  // EMAIL_DUPLICATE_ALLOWLIST に含まれるメアドのみアカウント切替UIを表示
  // （複数アカウントを保有する運用が想定されているユーザーのみ）
  const showAccountSwitcher = isEmailAllowedToDuplicate(user.email || "");

  // 署名済み書類のタイプを取得（トグルメニュー用）
  const signedDocs = await prisma.document.findMany({
    where: { userId: user.id, status: "SIGNED" },
    select: { type: true },
  });
  const signedDocTypes = signedDocs.map((d) => d.type);

  // 未同意時はナビ（ハンバーガー/サイドバー/下部ナビ）を非表示にし、
  // 同意前に他ページへ遷移させない。ただしブランド提示のためロゴのみのヘッダーは表示する。
  if (!hasAgreedTerms) {
    return (
      <div className="min-h-screen member-bg text-text-primary font-sans">
        {/* ロゴのみヘッダー（会員ヘッダーと同じネイビー。ナビ・ユーザー名・ハンバーガーは無し） */}
        <div className="sticky top-0 z-50 flex items-center px-4 sm:px-6 h-16 relative mhead">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_white.png" alt="BioVault" className="h-9 sm:h-10 w-auto" />
          <div className="mhead-hairline absolute bottom-0 left-0 right-0" />
        </div>
        <main className="px-4 py-8 sm:py-12 max-w-[800px] mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen member-bg text-text-primary font-sans flex flex-col">
      {/* 全幅ヘッダー（最前面レイヤー・ロゴ左・カード同系ネイビーグラデ）
          + ハンバーガー（PC・モバイル共通サブメニュー） */}
      <MobileNav isAdmin={false} userName={user.name} userRole={user.role} userId={user.id} signedDocTypes={signedDocTypes} showOnAllScreens showAccountSwitcher={showAccountSwitcher} />

      <div className="flex flex-1 min-h-0">
        {/* PC: グレーサイドバー（ヘッダーの下に配置） */}
        <div className="hidden lg:block">
          <Sidebar isAdmin={false} />
        </div>

        <div className="flex-1 relative w-full">
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
    </div>
  );
}
