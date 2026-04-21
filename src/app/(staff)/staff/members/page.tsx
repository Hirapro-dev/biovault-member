import { requireStaff } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import MembersTable from "@/components/members/MembersTable";
import { buildMemberRow, MEMBER_INCLUDE } from "@/lib/members-row";

export default async function StaffMembersPage() {
  const { staffCode } = await requireStaff();

  const members = await prisma.user.findMany({
    where: { referredByStaff: staffCode, role: "MEMBER" },
    include: MEMBER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  // 代理店担当も同時に解決
  const agencyCodes = [...new Set(members.map((m) => m.referredByAgency).filter(Boolean))] as string[];
  const agencyRecords = agencyCodes.length > 0
    ? await prisma.agencyProfile.findMany({
        where: { agencyCode: { in: agencyCodes } },
        select: { agencyCode: true, companyName: true, representativeName: true },
      })
    : [];
  const agencyMap = new Map(
    agencyRecords.map((a) => [a.agencyCode, a.companyName || a.representativeName || a.agencyCode])
  );

  const rows = members.map((m) => {
    const agencyName = m.referredByAgency ? agencyMap.get(m.referredByAgency) : null;
    return buildMemberRow(m, agencyName || "---");
  });

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        会員一覧
      </h2>
      <p className="text-sm text-text-muted mb-6">担当顧客: {members.length}名</p>

      <MembersTable rows={rows} hrefPrefix="/staff/members" emptyMessage="担当顧客がまだいません" />
    </div>
  );
}
