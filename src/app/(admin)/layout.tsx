import { requireAdmin } from "@/lib/auth-helpers";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary font-sans">
      {/* PC: サイドバー */}
      <div className="hidden lg:block">
        <Sidebar isAdmin={true} />
      </div>

      <div className="flex-1 overflow-y-auto relative w-full">
        {/* モバイル: ハンバーガーナビ */}
        <MobileNav isAdmin={true} userName={user.name} />

        {/* PC: ヘッダー */}
        <div className="hidden lg:block">
          <Header userName={user.name} isAdmin={true} />
        </div>

        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-8 max-w-[1200px] mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
