import { requireStaff } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import MembersTable from "@/components/members/MembersTable";
import { buildMemberRow, MEMBER_INCLUDE } from "@/lib/members-row";
import Link from "next/link";

export default async function StaffMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ scheme?: string }>;
}) {
  const { staffCode } = await requireStaff();
  const { scheme } = await searchParams;

  // 担当代理店のエージェントコード一覧を取得
  const managedAgencies = await prisma.user.findMany({
    where: { role: "AGENCY", referredByStaff: staffCode },
    select: { agencyProfile: { select: { agencyCode: true } } },
  });
  const managedAgencyCodes = managedAgencies
    .map((a) => a.agencyProfile?.agencyCode)
    .filter((c): c is string => !!c);

  // 直接担当 + 担当代理店経由の会員を取得
  const members = await prisma.user.findMany({
    where: {
      role: "MEMBER",
      OR: [
        { referredByStaff: staffCode },
        ...(managedAgencyCodes.length > 0 ? [{ referredByAgency: { in: managedAgencyCodes } }] : []),
      ],
      // スキームでの絞り込み（SCPP / MRT）
      ...(scheme === "SCPP" || scheme === "MRT" ? { scheme: scheme as "SCPP" | "MRT" } : {}),
    },
    include: MEMBER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  // 代理店名解決用マップ
  const agencyCodesForLookup = [...new Set(members.map((m) => m.referredByAgency).filter(Boolean))] as string[];
  const agencyRecords = agencyCodesForLookup.length > 0
    ? await prisma.agencyProfile.findMany({
        where: { agencyCode: { in: agencyCodesForLookup } },
        select: { agencyCode: true, companyName: true, representativeName: true },
      })
    : [];
  const agencyMap = new Map(
    agencyRecords.map((a) => [a.agencyCode, a.companyName || a.representativeName || a.agencyCode])
  );

  // 直接担当 / 代理店経由を分類してカウント
  const directCount = members.filter((m) => m.referredByStaff === staffCode).length;
  const viaAgencyCount = members.length - directCount;

  const rows = members.map((m) => {
    const agencyName = m.referredByAgency ? agencyMap.get(m.referredByAgency) : null;
    return buildMemberRow(m, agencyName || "---");
  });

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        会員一覧
      </h2>
      <p className="text-sm text-text-muted mb-4">
        担当顧客: {members.length}名
        <span className="text-[11px] text-text-muted ml-2">（直接紹介 {directCount}名 / 担当代理店経由 {viaAgencyCount}名）</span>
      </p>

      {/* スキームフィルタ（SCPP / MRT） */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[11px] text-text-muted mr-1">スキーム:</span>
        <SchemeFilterLink current={scheme} value="" label="全て" />
        <SchemeFilterLink current={scheme} value="SCPP" label="SCPPのみ" />
        <SchemeFilterLink current={scheme} value="MRT" label="MRTのみ" />
      </div>

      <MembersTable rows={rows} hrefPrefix="/staff/members" emptyMessage="担当顧客がまだいません" />
    </div>
  );
}

function SchemeFilterLink({
  current,
  value,
  label,
}: {
  current: string | undefined;
  value: string;
  label: string;
}) {
  const params = new URLSearchParams();
  if (value) params.set("scheme", value);
  const href = `/staff/members${params.toString() ? `?${params.toString()}` : ""}`;
  const active = (current || "") === value;
  return (
    <Link
      href={href}
      className={`text-[11px] px-2.5 py-1 rounded-sm border transition-colors ${
        active
          ? "bg-gold/20 text-gold border-gold/60"
          : "bg-bg-secondary text-text-muted border-border hover:border-gold/40"
      }`}
    >
      {label}
    </Link>
  );
}
