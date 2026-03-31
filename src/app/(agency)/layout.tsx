import { requireAgency } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import AgencySidebar from "@/components/agency/AgencySidebar";
import AgencyMobileNav from "@/components/agency/AgencyMobileNav";
import Header from "@/components/layout/Header";

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAgency();

  const profile = await prisma.agencyProfile.findUnique({
    where: { userId: user.id },
    select: { hasAgreedContract: true, hasAgreedPledge: true, hasAgreedNda: true },
  });

  const allAgreed = !!(profile?.hasAgreedContract && profile?.hasAgreedPledge && profile?.hasAgreedNda);

  // 未同意時はメニューなし
  if (!allAgreed) {
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
      <div className="hidden lg:block">
        <AgencySidebar />
      </div>
      <div className="flex-1 overflow-y-auto relative w-full">
        <AgencyMobileNav userName={user.name} />
        <div className="hidden lg:block">
          <Header userName={user.name} isAdmin={false} />
        </div>
        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-8 max-w-[1200px] mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
