import { requireAgency } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";

export default async function AgencyProfilePage() {
  const sessionUser = await requireAgency();
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { name: true, email: true, phone: true, address: true } });
  const profile = await prisma.agencyProfile.findUnique({ where: { userId: sessionUser.id } });
  if (!user) return null;

  const baseUrl = process.env.NEXTAUTH_URL || "https://member.biovault.jp";
  const referralUrl = `${baseUrl}/form/app?ref=${profile?.agencyCode}`;

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">エージェント情報</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-6">
          <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">基本情報</h3>
          <Row label="エージェントコード" value={profile?.agencyCode || "---"} mono />
          <Row label="法人名" value={profile?.companyName || "---"} />
          <Row label="代表者名" value={profile?.representativeName || user?.name || "---"} />
          <Row label="メール" value={user?.email || "---"} />
          <Row label="電話番号" value={user?.phone || "---"} />
          <Row label="住所" value={user?.address || "---"} />
          <Row label="報酬率" value={profile?.commissionRate ? `${profile.commissionRate}%` : "未設定"} />
        </div>

        <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-6">
          <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">振込先情報</h3>
          <Row label="銀行名" value={profile?.bankName || "未登録"} />
          <Row label="支店名" value={profile?.bankBranch || "未登録"} />
          <Row label="口座種別" value={profile?.bankAccountType || "未登録"} />
          <Row label="口座番号" value={profile?.bankAccountNumber || "未登録"} />
          <Row label="口座名義" value={profile?.bankAccountName || "未登録"} />
          <p className="text-[10px] text-text-muted mt-3">※ 振込先の変更は管理者までお問い合わせください</p>
        </div>
      </div>

      <div className="bg-bg-secondary border border-border-gold rounded-md p-5 sm:p-6">
        <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">紹介用URL</h3>
        <p className="text-xs text-text-secondary mb-3">以下のURLから申込みがあった場合、あなたの紹介として自動的に記録されます。</p>
        <div className="bg-bg-elevated border border-border rounded-md p-4 font-mono text-xs text-gold break-all select-all">
          {referralUrl}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center py-2 border-b border-border last:border-b-0">
      <div className="w-28 text-[11px] text-text-muted shrink-0">{label}</div>
      <div className={`text-xs text-text-primary ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
