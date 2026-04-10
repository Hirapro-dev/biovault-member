import { requireStaff } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReadOnlyMemberKarte from "@/components/karte/ReadOnlyMemberKarte";

/**
 * 従業員側 会員カルテ（閲覧専用）
 *
 * 従業員は自分が担当する会員のみアクセス可能（referredByStaff === staffCode）。
 * 担当外の会員にアクセスしようとした場合は notFound() で404扱い。
 *
 * 共通の ReadOnlyMemberKarte コンポーネントを利用し、
 * 管理者メモは従業員（社内）には表示する（showAdminNotes={true}）。
 */
export default async function StaffMemberKartePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { staffCode } = await requireStaff();
  const { id } = await params;

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

  // 担当外の会員アクセスは404扱い
  if (!user || user.role !== "MEMBER" || user.referredByStaff !== staffCode) {
    notFound();
  }

  // 担当従業員名を解決（表示用）
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
      showAdminNotes={true}
      backHref="/staff/members"
      backLabel="← 担当顧客一覧に戻る"
    />
  );
}
