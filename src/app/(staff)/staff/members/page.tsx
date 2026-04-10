import { requireStaff } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { IPS_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/types";

export default async function StaffMembersPage() {
  const { staffCode } = await requireStaff();

  const customers = await prisma.user.findMany({
    where: { referredByStaff: staffCode, role: "MEMBER" },
    include: {
      membership: true,
      cultureFluidOrders: { where: { paymentStatus: "COMPLETED" }, select: { totalAmount: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        会員一覧
      </h2>
      <p className="text-sm text-text-muted mb-6">担当顧客: {customers.length}名</p>

      <div className="bg-bg-secondary border border-border rounded-md overflow-hidden">
        {/* PC版テーブル */}
        <div className="hidden sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-[11px] text-text-muted">
                <th className="text-left px-4 py-3 font-normal">会員番号</th>
                <th className="text-left px-4 py-3 font-normal">氏名</th>
                <th className="text-left px-4 py-3 font-normal">ステータス</th>
                <th className="text-left px-4 py-3 font-normal">入金状況</th>
                <th className="text-right px-4 py-3 font-normal">売上</th>
                <th className="text-left px-4 py-3 font-normal">登録日</th>
                <th className="text-right px-4 py-3 font-normal">操作</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-b-0 hover:bg-bg-elevated transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3 font-mono text-[13px] text-gold">
                    <Link href={`/staff/members/${c.id}`} className="block">
                      {c.membership?.memberNumber || "---"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-primary">
                    <Link href={`/staff/members/${c.id}`} className="block group-hover:text-gold transition-colors">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-text-secondary">
                    <Link href={`/staff/members/${c.id}`} className="block">
                      {c.membership ? IPS_STATUS_LABELS[c.membership.ipsStatus] : "---"}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/staff/members/${c.id}`} className="block">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${
                        c.membership?.paymentStatus === "COMPLETED" ? "bg-status-active/10 text-status-active border-status-active/20" :
                        c.membership?.paymentStatus === "PARTIAL" ? "bg-status-warning/10 text-status-warning border-status-warning/20" :
                        "bg-text-muted/10 text-text-muted border-text-muted/20"
                      }`}>
                        {c.membership ? PAYMENT_STATUS_LABELS[c.membership.paymentStatus] : "---"}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[13px] text-text-secondary">
                    <Link href={`/staff/members/${c.id}`} className="block">
                      ¥{((c.membership?.paidAmount || 0) + c.cultureFluidOrders.reduce((s, o) => s + o.totalAmount, 0)).toLocaleString()}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-text-muted">
                    <Link href={`/staff/members/${c.id}`} className="block">
                      {new Date(c.createdAt).toLocaleDateString("ja-JP")}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/staff/members/${c.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm text-[11px] tracking-wider border border-border-gold text-gold hover:bg-gold/10 transition-all"
                    >
                      📋 カルテ
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* モバイル版カード */}
        <div className="sm:hidden divide-y divide-border">
          {customers.map((c) => (
            <Link
              key={c.id}
              href={`/staff/members/${c.id}`}
              className="block px-4 py-4 hover:bg-bg-elevated transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[13px] text-gold">{c.membership?.memberNumber || "---"}</span>
                  <span className="text-sm text-text-primary">{c.name}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                  c.membership?.paymentStatus === "COMPLETED" ? "bg-status-active/10 text-status-active border-status-active/20" :
                  "bg-text-muted/10 text-text-muted border-text-muted/20"
                }`}>
                  {c.membership ? PAYMENT_STATUS_LABELS[c.membership.paymentStatus] : "---"}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="text-[11px] text-text-muted">
                  {c.membership ? IPS_STATUS_LABELS[c.membership.ipsStatus] : "---"} ・ ¥{((c.membership?.paidAmount || 0) + c.cultureFluidOrders.reduce((s, o) => s + o.totalAmount, 0)).toLocaleString()}
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-[10px] tracking-wider border border-border-gold text-gold">
                  📋 カルテ
                </span>
              </div>
            </Link>
          ))}
        </div>

        {customers.length === 0 && (
          <div className="text-text-muted text-sm py-8 text-center">担当顧客がまだいません</div>
        )}
      </div>
    </div>
  );
}
