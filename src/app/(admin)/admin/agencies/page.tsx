import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function AdminAgenciesPage() {
  await requireAdmin();

  const agencies = await prisma.user.findMany({
    where: { role: "AGENCY" },
    include: { agencyProfile: { include: { _count: { select: { commissions: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 sm:mb-6">
        <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px]">代理店管理</h2>
        <Link href="/admin/create-account" className="shrink-0 px-4 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-xs sm:text-[13px] font-semibold tracking-wider hover:opacity-90 transition-all">+ 代理店登録</Link>
      </div>

      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {agencies.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">代理店はありません</div>
        ) : (
          <div className="divide-y divide-border">
            {agencies.map((a) => {
              const p = a.agencyProfile;
              const customerCount = 0; // TODO: count from referredByAgency
              return (
                <div key={a.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-bg-elevated transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[13px] text-gold">{p?.agencyCode || "---"}</span>
                      {!a.isIdIssued && <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-warning/10 text-status-warning border border-status-warning/20">ID未発行</span>}
                      {p?.agreedAt && <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-active/10 text-status-active border border-status-active/20">同意済</span>}
                    </div>
                    <div className="text-sm text-text-primary">{p?.companyName || a.name}</div>
                    <div className="text-[11px] text-text-muted">{a.email} ・ 報酬率 {p?.commissionRate || 0}%</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/members/${a.id}`} className="px-3 py-1 bg-transparent border border-border text-text-secondary rounded-sm text-[11px] hover:border-border-gold hover:text-gold transition-all">
                      詳細
                    </Link>
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
