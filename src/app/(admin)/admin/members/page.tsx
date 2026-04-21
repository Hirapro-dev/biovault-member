import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import MembersTable from "@/components/members/MembersTable";
import { buildMemberRow, MEMBER_INCLUDE } from "@/lib/members-row";
import Link from "next/link";
import MemberSearch from "./MemberSearch";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const { q, status } = await searchParams;

  const where: Record<string, unknown> = { role: "MEMBER" as const };

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { membership: { memberNumber: { contains: q } } },
    ];
  }

  const members = await prisma.user.findMany({
    where,
    include: MEMBER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  const filtered = status
    ? members.filter((m) => m.membership?.ipsStatus === status)
    : members;

  // 担当者名を一括取得（従業員コード → 名前、代理店コード → 名前）
  const staffCodes = [...new Set(filtered.map((m) => m.referredByStaff).filter(Boolean))] as string[];
  const agencyCodes = [...new Set(filtered.map((m) => m.referredByAgency).filter(Boolean))] as string[];

  const [staffRecords, agencyRecords] = await Promise.all([
    staffCodes.length > 0
      ? prisma.staff.findMany({ where: { staffCode: { in: staffCodes } }, select: { staffCode: true, name: true } })
      : [],
    agencyCodes.length > 0
      ? prisma.agencyProfile.findMany({ where: { agencyCode: { in: agencyCodes } }, select: { agencyCode: true, companyName: true, representativeName: true } })
      : [],
  ]);

  const staffMap = new Map(staffRecords.map((s) => [s.staffCode, s.name]));
  const agencyMap = new Map(agencyRecords.map((a) => [a.agencyCode, a.companyName || a.representativeName || a.agencyCode]));

  const getAssignedName = (m: { referredByStaff: string | null; referredByAgency: string | null }): string => {
    const parts: string[] = [];
    if (m.referredByStaff && staffMap.has(m.referredByStaff)) parts.push(staffMap.get(m.referredByStaff)!);
    if (m.referredByAgency && agencyMap.has(m.referredByAgency)) parts.push(agencyMap.get(m.referredByAgency)!);
    return parts.join(" / ") || "---";
  };

  const rows = filtered.map((m) => buildMemberRow(m, getAssignedName(m)));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 sm:mb-6">
        <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px]">
          会員一覧
        </h2>
        <div className="flex items-center gap-3">
          <MemberSearch />
          <Link
            href="/admin/create-account"
            className="shrink-0 px-4 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-xs sm:text-[13px] font-semibold tracking-wider hover:opacity-90 transition-all"
          >
            + アカウント発行
          </Link>
        </div>
      </div>

      <MembersTable rows={rows} hrefPrefix="/admin/members" />
    </div>
  );
}
