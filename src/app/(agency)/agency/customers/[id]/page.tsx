import { requireAgency } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReadOnlyMemberKarte from "@/components/karte/ReadOnlyMemberKarte";

/**
 * 代理店側 顧客カルテ（閲覧専用）
 *
 * 代理店は自分が紹介した顧客のみアクセス可能（referredByAgency === agencyCode）。
 * 紹介していない顧客にアクセスしようとした場合は notFound() で404扱い。
 *
 * 共通の ReadOnlyMemberKarte コンポーネントを利用し、
 * 管理者メモは代理店（社外）には表示しない（showAdminNotes={false}）。
 */
export default async function AgencyCustomerKartePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const agencyUser = await requireAgency();
  const { id } = await params;

  // 代理店プロフィールから agencyCode を取得
  const profile = await prisma.agencyProfile.findUnique({
    where: { userId: agencyUser.id },
    select: { agencyCode: true },
  });

  if (!profile?.agencyCode) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      membership: {
        include: { treatments: { orderBy: { createdAt: "desc" } } },
      },
      documents: { orderBy: { createdAt: "asc" } },
      cultureFluidOrders: { orderBy: { createdAt: "desc" } },
      notes: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { changedAt: "desc" } },
    },
  });

  // 自分が紹介した顧客以外のアクセスは404扱い
  if (!user || user.role !== "MEMBER" || user.referredByAgency !== profile.agencyCode) {
    notFound();
  }

  // 担当従業員名を解決（代理店経由でも表示）
  let staffName: string | null = null;
  if (user.referredByStaff) {
    const staffRecord = await prisma.staff.findUnique({
      where: { staffCode: user.referredByStaff },
      select: { name: true },
    });
    staffName = staffRecord?.name || null;
  }

  return (
    <ReadOnlyMemberKarte
      user={user}
      staffName={staffName}
      showAdminNotes={false}
      backHref="/agency/customers"
      backLabel="← 紹介顧客一覧に戻る"
    />
  );
}
