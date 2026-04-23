import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import MembersTable from "@/components/members/MembersTable";
import { buildMemberRow, MEMBER_INCLUDE } from "@/lib/members-row";
import AgencyKarteActions from "./AgencyKarteActions";
import AgencyInfoEditor from "./AgencyInfoEditor";
import ReferralUrlSection from "./ReferralUrlSection";
import CommissionList from "./CommissionList";
import CommissionSummaryCards from "@/components/commission/CommissionSummaryCards";
import { calcSummary } from "@/lib/commission-summary";
import IssueIdSection from "../../members/[id]/IssueIdSection";
import DeleteAccount from "../../members/[id]/DeleteAccount";

export default async function AgencyKartePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { agencyProfile: { include: { commissions: { orderBy: { createdAt: "desc" } } } } },
  });

  if (!user || user.role !== "AGENCY") notFound();

  const profile = user.agencyProfile;

  // 担当
  const staffRecord = user.referredByStaff
    ? await prisma.staff.findUnique({ where: { staffCode: user.referredByStaff }, select: { id: true, name: true, staffCode: true } })
    : null;

  // 紹介顧客一覧
  const customers = await prisma.user.findMany({
    where: { referredByAgency: profile?.agencyCode, role: "MEMBER" },
    include: MEMBER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  // 顧客の従業員担当名を解決
  const custStaffCodes = [...new Set(customers.map((c) => c.referredByStaff).filter(Boolean))] as string[];
  const custStaffRecords = custStaffCodes.length > 0
    ? await prisma.staff.findMany({
        where: { staffCode: { in: custStaffCodes } },
        select: { staffCode: true, name: true },
      })
    : [];
  const custStaffMap = new Map(custStaffRecords.map((s) => [s.staffCode, s.name]));
  const customerRows = customers.map((c) => {
    const staffName = c.referredByStaff ? custStaffMap.get(c.referredByStaff) : null;
    return buildMemberRow(c, staffName || "---");
  });

  // 印刷依頼
  const printRequests = await prisma.printRequest.findMany({
    where: { agencyUserId: id },
    orderBy: { createdAt: "desc" },
  });

  // サマリー集計
  const summary = calcSummary(profile?.commissions || []);

  return (
    <div>
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/admin/agencies" className="hover:text-gold transition-colors">エージェント一覧</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">カルテ</span>
      </div>

      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        代理店カルテ — {profile?.companyName || user.name}
      </h2>

      {/* 売上・報酬サマリー */}
      <CommissionSummaryCards summary={summary} />

      {/* 基本情報 + 契約情報（編集可） */}
      <AgencyInfoEditor
        userId={user.id}
        agencyProfileId={profile?.id || ""}
        initial={{
          companyName: profile?.companyName || "",
          representativeName: profile?.representativeName || user.name,
          nameKana: user.nameKana || "",
          loginId: user.loginId,
          email: user.email,
          phone: user.phone || "",
          address: user.address || "",
          agencyCode: profile?.agencyCode || "",
          commissionRate: profile?.commissionRate || 0,
          staffCommissionRate: profile?.staffCommissionRate || 0,
          bankName: profile?.bankName || "",
          bankBranch: profile?.bankBranch || "",
          bankAccountType: profile?.bankAccountType || "",
          bankAccountNumber: profile?.bankAccountNumber || "",
          bankAccountName: profile?.bankAccountName || "",
        }}
      />

      {/* 担当営業マン・契約同意（読み取り） */}
      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6 mb-5">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">担当営業マン・契約同意</h3>
        <div className="flex items-center py-2 border-b border-border">
          <div className="w-28 text-[11px] text-text-muted shrink-0">担当営業マン</div>
          <div className="text-[13px]">
            {staffRecord ? (
              <Link href={`/admin/staff/${staffRecord.id}`} className="text-gold hover:underline">
                {staffRecord.staffCode} — {staffRecord.name}
              </Link>
            ) : (
              <span className="text-text-muted">---</span>
            )}
          </div>
        </div>
        <div className="flex items-center py-2">
          <div className="w-28 text-[11px] text-text-muted shrink-0">契約同意</div>
          <div className="text-[13px]">
            {profile?.agreedAt ? (
              <span className="text-status-active">同意済 <span className="text-text-muted text-[11px] ml-1">({new Date(profile.agreedAt).toLocaleDateString("ja-JP")})</span></span>
            ) : (
              <span className="text-status-warning">未同意</span>
            )}
          </div>
        </div>
      </div>

      {/* 紹介URL発行 */}
      <ReferralUrlSection agencyCode={profile?.agencyCode || ""} />

      {/* アカウント情報（ID発行・PW変更） */}
      <IssueIdSection userId={user.id} currentLoginId={user.loginId} nameKana={user.nameKana || ""} isIdIssued={user.isIdIssued} />

      {/* 手動での報酬レコード追加（自動生成を補完） */}
      <AgencyKarteActions
        userId={user.id}
        agencyProfileId={profile?.id || ""}
        currentRate={profile?.commissionRate || 0}
      />

      {/* 紹介顧客一覧 */}
      <div className="mt-6">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4">
          紹介顧客 ({customers.length}名)
        </h3>
        <MembersTable rows={customerRows} hrefPrefix="/admin/members" emptyMessage="紹介顧客なし" />
      </div>

      {/* 報酬履歴 */}
      <CommissionList
        agencyProfileId={profile?.id || ""}
        commissions={(profile?.commissions || []).map((c) => ({
          id: c.id,
          memberName: c.memberName,
          memberNumber: c.memberNumber,
          saleAmount: c.saleAmount,
          commissionRate: c.commissionRate,
          commissionAmount: c.commissionAmount,
          staffCommissionRate: c.staffCommissionRate ?? 0,
          staffCommissionAmount: c.staffCommissionAmount ?? 0,
          staffCode: c.staffCode ?? null,
          contributionType: c.contributionType,
          status: c.status,
          note: c.note,
          sourceType: c.sourceType,
          paidAt: c.paidAt,
          createdAt: c.createdAt,
        }))}
      />

      {/* 印刷依頼履歴 */}
      <div className="mt-6 bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
          印刷依頼 ({printRequests.length}件)
        </h3>
        {printRequests.length === 0 ? (
          <div className="text-text-muted text-sm py-4 text-center">印刷依頼なし</div>
        ) : (
          <div className="divide-y divide-border">
            {printRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm text-text-primary">{r.quantity}部 — {r.paymentMethod === "bank_transfer" ? "銀行振込" : "代引き"}</div>
                  <div className="text-[11px] text-text-muted mt-0.5">{r.shippingAddress}</div>
                </div>
                <div className="text-[11px] text-text-muted font-mono">{new Date(r.createdAt).toLocaleDateString("ja-JP")}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* アカウント削除 */}
      <DeleteAccount userId={user.id} loginId={user.loginId} />
    </div>
  );
}
