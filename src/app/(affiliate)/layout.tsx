import { requireAffiliate } from "@/lib/auth-helpers";
import Header from "@/components/layout/Header";

// 紹介協力者ポータルの共通レイアウト
export default async function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAffiliate();

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary font-sans">
      <Header userName={user.name} isAdmin={false} />
      <main className="px-4 py-6 sm:px-6 sm:py-8 max-w-[900px] mx-auto animate-fade-in">
        {children}
      </main>
    </div>
  );
}
