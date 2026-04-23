import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import StaffCreateForm from "./StaffCreateForm";
import CommissionSummaryCards from "@/components/commission/CommissionSummaryCards";
import { calcSummaryForAllStaff } from "@/lib/commission-summary-from-data";

export default async function AdminStaffPage() {
  await requireAdmin();

  const staffList = await prisma.staff.findMany({
    orderBy: { createdAt: "desc" },
  });

  // 各スタッフの担当顧客数と売上を集計
  const staffWithStats = await Promise.all(
    staffList.map(async (s) => {
      const customers = await prisma.user.findMany({
        where: { referredByStaff: s.staffCode, role: "MEMBER" },
        select: { membership: { select: { paidAmount: true, totalAmount: true } } },
      });
      const customerCount = customers.length;
      const paidAmount = customers.reduce((sum, c) => sum + (c.membership?.paidAmount || 0), 0);
      return { ...s, customerCount, paidAmount };
    })
  );

  // 全営業マン合算の売上・報酬サマリー（実データから集計）
  const summary = await calcSummaryForAllStaff();

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        従業員管理
      </h2>

      {/* 全営業マン合算サマリー */}
      <CommissionSummaryCards summary={summary} variant="staff" />

      {/* 新規作成フォーム */}
      <StaffCreateForm />

      {/* 従業員一覧 */}
      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {staffWithStats.length === 0 ? (
          <div className="py-12 text-center text-text-muted text-sm">従業員はまだ登録されていません</div>
        ) : (
          <>
            {/* PC: テーブル */}
            <div className="hidden sm:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {["コード", "氏名", "担当数", "入金済売上", "ステータス"].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left text-[11px] text-text-muted tracking-wider font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staffWithStats.map((s) => (
                    <tr key={s.id} className="border-b border-border hover:bg-bg-elevated transition-colors">
                      <td className="px-4 py-3 font-mono text-[13px] text-gold">
                        <Link href={`/admin/staff/${s.id}`} className="hover:underline">
                          {s.staffCode}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link href={`/admin/staff/${s.id}`} className="hover:text-gold transition-colors">
                          {s.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary font-mono">{s.customerCount}名</td>
                      <td className="px-4 py-3 text-xs text-gold font-mono">¥{s.paidAmount.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {s.isActive ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-active/10 text-status-active border border-status-active/20">有効</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-text-muted/10 text-text-muted border border-text-muted/20">無効</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* モバイル: カードリスト */}
            <div className="sm:hidden divide-y divide-border">
              {staffWithStats.map((s) => (
                <div key={s.id} className="px-4 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <Link href={`/admin/staff/${s.id}`} className="font-mono text-[13px] text-gold hover:underline">
                      {s.staffCode}
                    </Link>
                    {s.isActive ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-active/10 text-status-active border border-status-active/20">有効</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-text-muted/10 text-text-muted border border-text-muted/20">無効</span>
                    )}
                  </div>
                  <Link href={`/admin/staff/${s.id}`} className="block text-sm text-text-primary mb-1 hover:text-gold transition-colors">
                    {s.name}
                  </Link>
                  <div className="text-[11px] text-text-muted">
                    担当 {s.customerCount}名 ・ 入金済売上 ¥{s.paidAmount.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
