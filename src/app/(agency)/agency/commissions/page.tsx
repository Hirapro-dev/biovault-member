import { requireAgency } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Badge from "@/components/ui/Badge";

const STATUS_MAP: Record<string, { label: string; variant: "gold" | "success" | "warning" | "muted" }> = {
  PENDING: { label: "未確定", variant: "warning" },
  CONFIRMED: { label: "確定", variant: "gold" },
  PAID: { label: "支払済", variant: "success" },
  CANCELLED: { label: "取消", variant: "muted" },
};

export default async function CommissionsPage() {
  const user = await requireAgency();
  const profile = await prisma.agencyProfile.findUnique({ where: { userId: user.id } });
  const commissions = await prisma.agencyCommission.findMany({
    where: { agencyProfileId: profile?.id },
    orderBy: { createdAt: "desc" },
  });

  const total = commissions.reduce((s, c) => s + c.commissionAmount, 0);
  const paid = commissions.filter((c) => c.status === "PAID").reduce((s, c) => s + c.commissionAmount, 0);

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">報酬管理</h2>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-bg-secondary border border-border rounded-md p-5 text-center">
          <div className="text-[11px] text-text-muted mb-1">報酬合計</div>
          <div className="font-mono text-xl text-gold">¥{total.toLocaleString()}</div>
        </div>
        <div className="bg-bg-secondary border border-border rounded-md p-5 text-center">
          <div className="text-[11px] text-text-muted mb-1">支払済</div>
          <div className="font-mono text-xl text-status-active">¥{paid.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {commissions.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">報酬記録はありません</div>
        ) : (
          <div className="divide-y divide-border">
            {commissions.map((c) => {
              const st = STATUS_MAP[c.status] || STATUS_MAP.PENDING;
              return (
                <div key={c.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="text-sm text-text-primary">{c.memberName}（{c.memberNumber}）</div>
                    <div className="text-[11px] text-text-muted mt-0.5">{c.contributionType} ・ 売上 ¥{c.saleAmount.toLocaleString()} × {c.commissionRate}%</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-sm text-gold">¥{c.commissionAmount.toLocaleString()}</div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
