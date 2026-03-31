import { requireAgency } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";

export default async function AgencyDashboardPage() {
  const user = await requireAgency();

  const profile = await prisma.agencyProfile.findUnique({
    where: { userId: user.id },
    include: { commissions: true },
  });

  const customerCount = await prisma.user.count({
    where: { referredByAgency: profile?.agencyCode, role: "MEMBER" },
  });

  const totalCommission = profile?.commissions.reduce((sum, c) => sum + c.commissionAmount, 0) || 0;
  const pendingCommission = profile?.commissions.filter((c) => c.status === "PENDING").reduce((sum, c) => sum + c.commissionAmount, 0) || 0;
  const paidCommission = profile?.commissions.filter((c) => c.status === "PAID").reduce((sum, c) => sum + c.commissionAmount, 0) || 0;

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        ダッシュボード
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="紹介顧客数" value={String(customerCount)} sub="名" />
        <StatCard label="報酬合計" value={`¥${totalCommission.toLocaleString()}`} sub="" />
        <StatCard label="未確定報酬" value={`¥${pendingCommission.toLocaleString()}`} sub="" />
        <StatCard label="支払済報酬" value={`¥${paidCommission.toLocaleString()}`} sub="" />
      </div>

      <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-6 mb-5">
        <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">エージェント情報</h3>
        <div className="space-y-2">
          <InfoRow label="エージェントコード" value={profile?.agencyCode || "---"} mono />
          <InfoRow label="法人名" value={profile?.companyName || "---"} />
          <InfoRow label="代表者名" value={profile?.representativeName || user.name} />
          <InfoRow label="報酬率" value={profile?.commissionRate ? `${profile.commissionRate}%` : "未設定"} />
        </div>
      </div>

      <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-6">
        <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">紹介用URL</h3>
        <p className="text-xs text-text-secondary mb-3">以下のURLを見込顧客にお伝えください。申込フォームに自動的にあなたの紹介元が挿入されます。</p>
        <div className="bg-bg-elevated border border-border rounded-md p-3 font-mono text-xs text-gold break-all">
          {typeof window !== "undefined" ? window.location.origin : "https://biovault-member.vercel.app"}/form/app?ref={profile?.agencyCode || "---"}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6 text-center">
      <div className="text-[11px] text-text-muted tracking-[2px] mb-2">{label}</div>
      <div className="font-mono text-xl sm:text-2xl text-gold font-light">{value}</div>
      {sub && <div className="text-[11px] text-text-secondary">{sub}</div>}
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center py-2 border-b border-border last:border-b-0">
      <div className="w-32 text-[11px] text-text-muted shrink-0">{label}</div>
      <div className={`text-sm text-text-primary ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
