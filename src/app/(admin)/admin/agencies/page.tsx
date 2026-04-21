import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import IssueIdModal from "../members/IssueIdModal";

export default async function AdminAgenciesPage() {
  await requireAdmin();

  const agencies = await prisma.user.findMany({
    where: { role: "AGENCY" },
    include: { agencyProfile: true },
    orderBy: { createdAt: "desc" },
  });

  // 各エージェントの紹介顧客数・入金済売上を取得
  const customerCounts: Record<string, number> = {};
  const paidAmounts: Record<string, number> = {};
  for (const a of agencies) {
    if (a.agencyProfile?.agencyCode) {
      const customers = await prisma.user.findMany({
        where: { referredByAgency: a.agencyProfile.agencyCode, role: "MEMBER" },
        select: {
          membership: { select: { paidAmount: true } },
          cultureFluidOrders: {
            where: { paymentStatus: "COMPLETED" },
            select: { totalAmount: true },
          },
        },
      });
      customerCounts[a.id] = customers.length;
      paidAmounts[a.id] = customers.reduce((sum, c) => {
        const ipsPaid = c.membership?.paidAmount ?? 0;
        const cfPaid = c.cultureFluidOrders.reduce((s, o) => s + o.totalAmount, 0);
        return sum + ipsPaid + cfPaid;
      }, 0);
    }
  }

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        エージェント一覧
      </h2>

      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {agencies.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">エージェントはありません</div>
        ) : (
          <>
            {/* PC: テーブル */}
            <div className="hidden sm:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {["コード", "法人名/氏名", "メール", "紹介数", "入金済売上", "報酬率", "ステータス", "ID"].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agencies.map((a) => {
                    const p = a.agencyProfile;
                    return (
                      <tr key={a.id} className="border-b border-border hover:bg-bg-elevated transition-colors">
                        <td className="px-4 py-3 font-mono text-[13px] text-gold">
                          <Link href={`/admin/agencies/${a.id}`} className="hover:underline">
                            {p?.agencyCode || "---"}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Link href={`/admin/agencies/${a.id}`} className="hover:text-gold transition-colors">
                            {p?.companyName || a.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-secondary">{a.email}</td>
                        <td className="px-4 py-3 text-xs text-text-secondary font-mono">{customerCounts[a.id] || 0}名</td>
                        <td className="px-4 py-3 text-xs text-gold font-mono">¥{(paidAmounts[a.id] || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-gold font-mono">{p?.commissionRate || 0}%</td>
                        <td className="px-4 py-3">
                          {p?.agreedAt ? (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-active/10 text-status-active border border-status-active/20">同意済</span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-text-muted/10 text-text-muted border border-text-muted/20">未同意</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <IssueIdModal userId={a.id} loginId={a.loginId} nameKana={a.nameKana || ""} isIdIssued={a.isIdIssued} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* モバイル: カードリスト */}
            <div className="sm:hidden divide-y divide-border">
              {agencies.map((a) => {
                const p = a.agencyProfile;
                return (
                  <div key={a.id} className="px-4 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <Link href={`/admin/agencies/${a.id}`} className="font-mono text-[13px] text-gold hover:underline">
                        {p?.agencyCode || "---"}
                      </Link>
                      <div className="flex items-center gap-1.5">
                        {p?.agreedAt ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-active/10 text-status-active border border-status-active/20">同意済</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-text-muted/10 text-text-muted border border-text-muted/20">未同意</span>
                        )}
                      </div>
                    </div>
                    <Link href={`/admin/agencies/${a.id}`} className="block text-sm text-text-primary mb-1 hover:text-gold transition-colors">
                      {p?.companyName || a.name}
                    </Link>
                    <div className="text-[11px] text-text-muted mb-2">
                      {a.email} ・ 報酬率 {p?.commissionRate || 0}% ・ 紹介 {customerCounts[a.id] || 0}名 ・ 入金済売上 ¥{(paidAmounts[a.id] || 0).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <IssueIdModal userId={a.id} loginId={a.loginId} nameKana={a.nameKana || ""} isIdIssued={a.isIdIssued} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
