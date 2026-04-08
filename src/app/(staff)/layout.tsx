import { requireStaff } from "@/lib/auth-helpers";
import StaffSidebar from "@/components/staff/StaffSidebar";
import StaffMobileNav from "@/components/staff/StaffMobileNav";
import Header from "@/components/layout/Header";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary font-sans">
      <div className="hidden lg:block">
        <StaffSidebar />
      </div>
      <div className="flex-1 overflow-y-auto relative w-full">
        <StaffMobileNav userName={user.name} />
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
