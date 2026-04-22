import { requireStaff } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function StaffAgenciesPage() {
  const { staffCode } = await requireStaff();

  // 自分（= staffCode）が担当する代理店のみ取得
  const agencies = await prisma.user.findMany({
    where: { role: "AGENCY", referredByStaff: staffCode },
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
        担当代理店 <span className="text-sm text-text-muted font-normal">（{agencies.length}名）</span>
      </h2>

      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {agencies.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">担当代理店はまだいません</div>
        ) : (
          <>
            {/* PC: テーブル（横スクロール + コード/法人名 左固定） */}
            <div className="hidden sm:block overflow-x-auto max-w-full">
              <table className="border-collapse" style={{ tableLayout: "fixed", width: "1040px" }}>
                <colgroup>
                  <col style={{ width: "110px" }} />
                  <col style={{ width: "220px" }} />
                  <col style={{ width: "140px" }} />
                  <col style={{ width: "180px" }} />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "140px" }} />
                  <col style={{ width: "130px" }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th
                      className="sticky z-20 bg-bg-secondary px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal whitespace-nowrap"
                      style={{ left: 0 }}
                    >
                      コード
                    </th>
                    <th
                      className="sticky z-20 bg-bg-secondary px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal whitespace-nowrap border-r border-border"
                      style={{ left: "110px" }}
                    >
                      法人名/氏名
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal whitespace-nowrap">紹介数</th>
                    <th className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal whitespace-nowrap">入金済売上</th>
                    <th className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal whitespace-nowrap">報酬率</th>
                    <th className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal whitespace-nowrap">ステータス</th>
                    <th className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal whitespace-nowrap">登録日</th>
                  </tr>
                </thead>
                <tbody>
                  {agencies.map((a) => {
                    const p = a.agencyProfile;
                    const statusBadge = !a.isIdIssued
                      ? { label: "ID未発行", className: "bg-text-muted/10 text-text-muted border border-text-muted/20" }
                      : p?.agreedAt
                        ? { label: "同意書済", className: "bg-status-active/10 text-status-active border border-status-active/20" }
                        : { label: "同意書未", className: "bg-status-warning/10 text-status-warning border border-status-warning/20" };
                    return (
                      <tr key={a.id} className="border-b border-border">
                        <td
                          className="sticky z-10 bg-bg-secondary px-4 py-3 font-mono text-[13px] text-gold whitespace-nowrap"
                          style={{ left: 0 }}
                        >
                          <Link href={`/staff/agencies/${a.id}`} className="hover:underline">
                            {p?.agencyCode || "---"}
                          </Link>
                        </td>
                        <td
                          className="sticky z-10 bg-bg-secondary px-4 py-3 text-sm whitespace-nowrap border-r border-border overflow-hidden text-ellipsis"
                          style={{ left: "110px" }}
                        >
                          <Link href={`/staff/agencies/${a.id}`} className="hover:text-gold transition-colors">
                            {p?.companyName || a.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-secondary font-mono whitespace-nowrap">{customerCounts[a.id] || 0}名</td>
                        <td className="px-4 py-3 text-xs text-gold font-mono whitespace-nowrap">¥{(paidAmounts[a.id] || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-gold font-mono whitespace-nowrap">{p?.commissionRate || 0}%</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-text-muted font-mono whitespace-nowrap">
                          {new Date(a.createdAt).toLocaleDateString("ja-JP")}
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
                const statusBadge = !a.isIdIssued
                  ? { label: "ID未発行", className: "bg-text-muted/10 text-text-muted border border-text-muted/20" }
                  : p?.agreedAt
                    ? { label: "同意書済", className: "bg-status-active/10 text-status-active border border-status-active/20" }
                    : { label: "同意書未", className: "bg-status-warning/10 text-status-warning border border-status-warning/20" };
                return (
                  <div key={a.id} className="px-4 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <Link href={`/staff/agencies/${a.id}`} className="font-mono text-[13px] text-gold hover:underline">
                        {p?.agencyCode || "---"}
                      </Link>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>
                    <Link href={`/staff/agencies/${a.id}`} className="block text-sm text-text-primary mb-1 hover:text-gold transition-colors">
                      {p?.companyName || a.name}
                    </Link>
                    <div className="text-[11px] text-text-muted">
                      報酬率 {p?.commissionRate || 0}% ・ 紹介 {customerCounts[a.id] || 0}名 ・ 入金済売上 ¥{(paidAmounts[a.id] || 0).toLocaleString()}
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
