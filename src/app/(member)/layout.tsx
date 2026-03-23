import { requireAuth } from "@/lib/auth-helpers";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary font-sans">
      <Sidebar isAdmin={false} />
      <div className="flex-1 overflow-y-auto relative">
        <Header userName={user.name} isAdmin={isAdmin} />
        <main className="p-8 px-10 max-w-[1200px] mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
