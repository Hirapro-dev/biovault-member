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

  // 各エージェントの紹介顧客数を取得
  const customerCounts: Record<string, number> = {};
  for (const a of agencies) {
    if (a.agencyProfile?.agencyCode) {
      customerCounts[a.id] = await prisma.user.count({
        where: { referredByAgency: a.agencyProfile.agencyCode, role: "MEMBER" },
      });
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
                    {["コード", "法人名/氏名", "メール", "紹介数", "報酬率", "ステータス", "ID", ""].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {agencies.map((a) => {
                    const p = a.agencyProfile;
                    return (
                      <tr key={a.id} className="border-b border-border hover:bg-bg-elevated transition-colors">
                        <td className="px-4 py-3 font-mono text-[13px] text-gold">{p?.agencyCode || "---"}</td>
                        <td className="px-4 py-3 text-sm">{p?.companyName || a.name}</td>
                        <td className="px-4 py-3 text-xs text-text-secondary">{a.email}</td>
                        <td className="px-4 py-3 text-xs text-text-secondary font-mono">{customerCounts[a.id] || 0}名</td>
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
                        <td className="px-4 py-3">
                          <Link href={`/admin/agencies/${a.id}`} className="px-3 py-1 bg-transparent border border-border text-text-secondary rounded-sm text-[11px] hover:border-border-gold hover:text-gold transition-all">
                            カルテ
                          </Link>
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
                      <span className="font-mono text-[13px] text-gold">{p?.agencyCode || "---"}</span>
                      <div className="flex items-center gap-1.5">
                        {p?.agreedAt ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-active/10 text-status-active border border-status-active/20">同意済</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-text-muted/10 text-text-muted border border-text-muted/20">未同意</span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-text-primary mb-1">{p?.companyName || a.name}</div>
                    <div className="text-[11px] text-text-muted mb-2">{a.email} ・ 報酬率 {p?.commissionRate || 0}% ・ 紹介 {customerCounts[a.id] || 0}名</div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/agencies/${a.id}`} className="px-3 py-1 bg-transparent border border-border text-text-secondary rounded-sm text-[11px] hover:border-border-gold hover:text-gold transition-all">
                        カルテ
                      </Link>
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
