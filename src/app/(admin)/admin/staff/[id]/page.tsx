import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { IPS_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/types";
import StaffReferralUrlSection from "./StaffReferralUrlSection";
import StaffKarteActions from "./StaffKarteActions";

export default async function StaffKartePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) notFound();

  // 担当顧客一覧
  const customers = await prisma.user.findMany({
    where: { referredByStaff: staff.staffCode, role: "MEMBER" },
    include: { membership: true },
    orderBy: { createdAt: "desc" },
  });

  // 売上サマリー（入金済み金額のみ）
  const paidAmount = customers.reduce((sum, c) => sum + (c.membership?.paidAmount || 0), 0);

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

      {/* 基本情報 + 実績サマリー */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
          <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">基本情報</h3>
          <Row label="従業員コード" value={staff.staffCode} mono />
          <Row label="氏名" value={staff.name} />
          <Row label="フリガナ" value={staff.nameKana || "---"} />
          <Row label="電話番号" value={staff.phone || "---"} />
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
        currentPhone={staff.phone || ""}
        currentEmail={staff.email || ""}
        currentNote={staff.note || ""}
        isActive={staff.isActive}
      />

      {/* 紹介URL発行 */}
      <StaffReferralUrlSection staffCode={staff.staffCode} />

      {/* 担当顧客一覧 */}
      <div className="mt-6 bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
          担当顧客 ({customers.length}名)
        </h3>
        {customers.length === 0 ? (
          <div className="text-text-muted text-sm py-4 text-center">担当顧客なし</div>
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
                    {c.membership ? PAYMENT_STATUS_LABELS[c.membership.paymentStatus] : "---"} ・
                    ¥{(c.membership?.paidAmount || 0).toLocaleString()} / ¥{(c.membership?.totalAmount || 0).toLocaleString()}
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
