import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { IPS_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/types";
import AgencyKarteActions from "./AgencyKarteActions";
import ReferralUrlSection from "./ReferralUrlSection";
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
    include: { membership: true },
    orderBy: { createdAt: "desc" },
  });

  // 印刷依頼
  const printRequests = await prisma.printRequest.findMany({
    where: { agencyUserId: id },
    orderBy: { createdAt: "desc" },
  });

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

      {/* 基本情報 + 契約情報 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
          <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">基本情報</h3>
          <Row label="法人名/屋号" value={profile?.companyName || "---"} />
          <Row label="代表者名" value={profile?.representativeName || user.name} />
          <Row label="フリガナ" value={user.nameKana || "---"} />
          <Row label="ログインID" value={user.loginId} mono />
          <Row label="メール" value={user.email} />
          <Row label="電話番号" value={user.phone || "---"} />
          <Row label="住所" value={user.address || "---"} />
          <Row label="登録日" value={new Date(user.createdAt).toLocaleDateString("ja-JP")} />
          <div className="flex items-center py-2 border-t border-border mt-1">
            <div className="w-28 text-[11px] text-text-muted shrink-0">担当</div>
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
        </div>

        <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
          <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">契約情報</h3>
          <Row label="エージェントコード" value={profile?.agencyCode || "---"} mono />
          <Row label="報酬率" value={profile?.commissionRate ? `${profile.commissionRate}%` : "未設定"} />
          <Row label="銀行名" value={profile?.bankName || "未登録"} />
          <Row label="支店名" value={profile?.bankBranch || "未登録"} />
          <Row label="口座種別" value={profile?.bankAccountType || "未登録"} />
          <Row label="口座番号" value={profile?.bankAccountNumber || "未登録"} />
          <Row label="口座名義" value={profile?.bankAccountName || "未登録"} />
          <div className="flex items-center py-2 border-t border-border mt-1">
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
      </div>

      {/* 紹介URL発行 */}
      <ReferralUrlSection agencyCode={profile?.agencyCode || ""} />

      {/* アカウント情報（ID発行・PW変更） */}
      <IssueIdSection userId={user.id} currentLoginId={user.loginId} nameKana={user.nameKana || ""} isIdIssued={user.isIdIssued} />

      {/* 報酬率・振込先の編集 */}
      <AgencyKarteActions
        userId={user.id}
        agencyProfileId={profile?.id || ""}
        currentRate={profile?.commissionRate || 0}
        bankName={profile?.bankName || ""}
        bankBranch={profile?.bankBranch || ""}
        bankAccountType={profile?.bankAccountType || ""}
        bankAccountNumber={profile?.bankAccountNumber || ""}
        bankAccountName={profile?.bankAccountName || ""}
      />

      {/* 紹介顧客一覧 */}
      <div className="mt-6 bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
          紹介顧客 ({customers.length}名)
        </h3>
        {customers.length === 0 ? (
          <div className="text-text-muted text-sm py-4 text-center">紹介顧客なし</div>
        ) : (
          <div className="divide-y divide-border">
            {customers.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] text-gold">{c.membership?.memberNumber || "---"}</span>
                    <span className="text-sm text-text-primary">{c.name}</span>
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {c.membership ? IPS_STATUS_LABELS[c.membership.ipsStatus] : "---"} ・
                    {c.membership ? PAYMENT_STATUS_LABELS[c.membership.paymentStatus] : "---"}
                  </div>
                </div>
                <Link href={`/admin/members/${c.id}`} className="px-3 py-1 bg-transparent border border-border text-text-secondary rounded-sm text-[11px] hover:border-border-gold hover:text-gold transition-all">
                  カルテ
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 報酬履歴 */}
      <div className="mt-6 bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
          報酬履歴 ({profile?.commissions.length || 0}件)
        </h3>
        {!profile?.commissions.length ? (
          <div className="text-text-muted text-sm py-4 text-center">報酬記録なし</div>
        ) : (
          <div className="divide-y divide-border">
            {profile.commissions.map((c) => {
              const stMap: Record<string, { label: string; variant: "gold" | "success" | "warning" | "muted" }> = {
                PENDING: { label: "未確定", variant: "warning" },
                CONFIRMED: { label: "確定", variant: "gold" },
                PAID: { label: "支払済", variant: "success" },
                CANCELLED: { label: "取消", variant: "muted" },
              };
              const st = stMap[c.status] || stMap.PENDING;
              return (
                <div key={c.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-sm text-text-primary">{c.memberName}（{c.memberNumber}）</div>
                    <div className="text-[11px] text-text-muted mt-0.5">{c.contributionType} ・ 売上 ¥{c.saleAmount.toLocaleString()} × {c.commissionRate}%</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-gold">¥{c.commissionAmount.toLocaleString()}</span>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center py-2 border-b border-border last:border-b-0">
      <div className="w-28 text-[11px] text-text-muted shrink-0">{label}</div>
      <div className={`text-[13px] text-text-primary ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
