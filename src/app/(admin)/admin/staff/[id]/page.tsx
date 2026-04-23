import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import MembersTable from "@/components/members/MembersTable";
import { buildMemberRow, MEMBER_INCLUDE } from "@/lib/members-row";
import StaffReferralUrlSection from "./StaffReferralUrlSection";
import StaffKarteActions from "./StaffKarteActions";
import StaffLoginSection from "./StaffLoginSection";
import CommissionSummaryCards from "@/components/commission/CommissionSummaryCards";
import { calcSummaryForStaff } from "@/lib/commission-summary-from-data";

export default async function StaffKartePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const staff = await prisma.staff.findUnique({
    where: { id },
    include: { user: { select: { loginId: true } } },
  });
  if (!staff) notFound();

  // 担当顧客一覧
  const customers = await prisma.user.findMany({
    where: { referredByStaff: staff.staffCode, role: "MEMBER" },
    include: MEMBER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  // 顧客の代理店担当名を解決
  const custAgencyCodes = [...new Set(customers.map((c) => c.referredByAgency).filter(Boolean))] as string[];
  const custAgencyRecords = custAgencyCodes.length > 0
    ? await prisma.agencyProfile.findMany({
        where: { agencyCode: { in: custAgencyCodes } },
        select: { agencyCode: true, companyName: true, representativeName: true },
      })
    : [];
  const custAgencyMap = new Map(
    custAgencyRecords.map((a) => [a.agencyCode, a.companyName || a.representativeName || a.agencyCode])
  );
  const customerRows = customers.map((c) => {
    const agencyName = c.referredByAgency ? custAgencyMap.get(c.referredByAgency) : null;
    return buildMemberRow(c, agencyName || "---");
  });

  // 担当代理店一覧
  const agencies = await prisma.user.findMany({
    where: { referredByStaff: staff.staffCode, role: "AGENCY" },
    include: { agencyProfile: true },
    orderBy: { createdAt: "desc" },
  });

  // 売上サマリー（入金済み金額のみ）
  const paidAmount = customers.reduce((sum, c) => sum + (c.membership?.paidAmount || 0), 0);

  // 報酬サマリー（実データから集計）
  const summary = await calcSummaryForStaff(staff.staffCode);

  return (
    <div>
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/admin/staff" className="hover:text-gold transition-colors">従業員管理</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">カルテ</span>
      </div>

      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        従業員カルテ — {staff.name}
      </h2>

      {/* 売上・報酬サマリー（営業マン向け: 売上 / 営業マン売上報酬 / 代理店分配報酬） */}
      <CommissionSummaryCards summary={summary} variant="staff" />

      {/* 基本情報 + 実績サマリー */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
          <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">基本情報</h3>
          <Row label="従業員コード" value={staff.staffCode} mono />
          <Row label="氏名" value={staff.name} />
          <Row label="フリガナ" value={staff.nameKana || "---"} />
          <Row label="メール" value={staff.email || "---"} />
          <Row label="登録日" value={new Date(staff.createdAt).toLocaleDateString("ja-JP")} />
          <div className="flex items-center py-2 border-t border-border mt-1">
            <div className="w-28 text-[11px] text-text-muted shrink-0">ステータス</div>
            <div className="text-[13px]">
              {staff.isActive ? (
                <span className="text-status-active">有効</span>
              ) : (
                <span className="text-text-muted">無効</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
          <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">実績サマリー</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-[10px] text-text-muted tracking-wider mb-1">担当数</div>
              <div className="font-mono text-xl text-gold">{customers.length}</div>
              <div className="text-[10px] text-text-muted">名</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-text-muted tracking-wider mb-1">入金済売上</div>
              <div className="font-mono text-lg text-status-active">¥{paidAmount.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 基本情報編集 */}
      <StaffKarteActions
        staffId={staff.id}
        currentName={staff.name}
        currentNameKana={staff.nameKana || ""}
        currentEmail={staff.email || ""}
        currentNote={staff.note || ""}
        isActive={staff.isActive}
      />

      {/* ログインアカウント */}
      <StaffLoginSection
        staffId={staff.id}
        currentLoginId={staff.user?.loginId || null}
        nameKana={staff.nameKana || ""}
        isIssued={!!staff.userId}
      />

      {/* 紹介URL発行 */}
      <StaffReferralUrlSection staffCode={staff.staffCode} />

      {/* 担当顧客一覧 */}
      <div className="mt-6">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4">
          担当顧客 ({customers.length}名)
        </h3>
        <MembersTable rows={customerRows} hrefPrefix="/admin/members" emptyMessage="担当顧客なし" />
      </div>

      {/* 担当代理店一覧 */}
      <div className="mt-6 bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
          担当代理店 ({agencies.length}名)
        </h3>
        {agencies.length === 0 ? (
          <div className="text-text-muted text-sm py-4 text-center">担当代理店なし</div>
        ) : (
          <div className="divide-y divide-border">
            {agencies.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] text-gold">{a.agencyProfile?.agencyCode || "---"}</span>
                    <span className="text-sm text-text-primary">{a.name}</span>
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {a.agencyProfile?.companyName || "個人"} ・
                    {a.agencyProfile?.isActive ? "有効" : "無効"} ・
                    登録: {new Date(a.createdAt).toLocaleDateString("ja-JP")}
                  </div>
                </div>
                <Link href={`/admin/agencies/${a.id}`} className="px-3 py-1 bg-transparent border border-border text-text-secondary rounded-sm text-[11px] hover:border-border-gold hover:text-gold transition-all">
                  詳細
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center py-2 border-b border-border last:border-b-0">
      <div className="w-28 text-[11px] text-text-muted shrink-0">{label}</div>
      <div className={`text-[13px] text-text-primary ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
