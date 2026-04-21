import { requireAgency } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import MembersTable from "@/components/members/MembersTable";
import { buildMemberRow, MEMBER_INCLUDE } from "@/lib/members-row";

export default async function CustomersPage() {
  const user = await requireAgency();
  const profile = await prisma.agencyProfile.findUnique({ where: { userId: user.id } });

  const members = await prisma.user.findMany({
    where: { referredByAgency: profile?.agencyCode, role: "MEMBER" },
    include: MEMBER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  // 従業員担当も同時に解決
  const staffCodes = [...new Set(members.map((m) => m.referredByStaff).filter(Boolean))] as string[];
  const staffRecords = staffCodes.length > 0
    ? await prisma.staff.findMany({
        where: { staffCode: { in: staffCodes } },
        select: { staffCode: true, name: true },
      })
    : [];
  const staffMap = new Map(staffRecords.map((s) => [s.staffCode, s.name]));

  const rows = members.map((m) => {
    const staffName = m.referredByStaff ? staffMap.get(m.referredByStaff) : null;
    return buildMemberRow(m, staffName || "---");
  });

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        顧客管理 <span className="text-sm text-text-muted font-normal">（{members.length}名）</span>
      </h2>

      <MembersTable rows={rows} hrefPrefix="/agency/customers" emptyMessage="紹介顧客はまだいません" />
    </div>
  );
}
