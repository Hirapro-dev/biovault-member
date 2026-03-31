import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import { IPS_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/types";
import Link from "next/link";
import MemberSearch from "./MemberSearch";
import IssueIdModal from "./IssueIdModal";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAdmin();
  const { q, status } = await searchParams;

  const where: Record<string, unknown> = { role: "MEMBER" as const };

  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { membership: { memberNumber: { contains: q } } },
    ];
  }

  const members = await prisma.user.findMany({
    where,
    include: { membership: true },
    orderBy: { createdAt: "desc" },
  });

  const filtered = status
    ? members.filter((m) => m.membership?.ipsStatus === status)
    : members;

  const paymentColors: Record<string, string> = {
    COMPLETED: "text-status-active",
    PARTIAL: "text-status-warning",
    PENDING: "text-status-danger",
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 sm:mb-6">
        <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px]">
          会員一覧
        </h2>
        <div className="flex items-center gap-3">
          <MemberSearch />
          <Link
            href="/admin/create-account"
            className="shrink-0 px-4 py-2.5 bg-gold-gradient border-none rounded-sm text-bg-primary text-xs sm:text-[13px] font-semibold tracking-wider hover:opacity-90 transition-all"
          >
            + アカウント発行
          </Link>
        </div>
      </div>

      {/* モバイル: カードリスト */}
      <div className="flex flex-col gap-3 sm:hidden">
        {filtered.map((m) => (
          <div key={m.id} className="bg-bg-secondary border border-border rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[13px] text-gold">
                {m.membership?.memberNumber || "---"}
              </span>
              <div className="flex items-center gap-2">
                {!m.isIdIssued && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-warning/10 text-status-warning border border-status-warning/20">未発行</span>
                )}
                <span
                  className={`text-[11px] ${
                    m.membership
                      ? paymentColors[m.membership.paymentStatus] || "text-text-secondary"
                      : "text-text-secondary"
                  }`}
                >
                  {m.membership ? PAYMENT_STATUS_LABELS[m.membership.paymentStatus] : "---"}
                </span>
              </div>
            </div>
            <div className="text-sm text-text-primary mb-2">{m.name}</div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
                {m.membership ? IPS_STATUS_LABELS[m.membership.ipsStatus] : "---"}
              </span>
              <div className="flex items-center gap-2">
                <Link href={`/admin/members/${m.id}`} className="px-3 py-1 bg-transparent border border-border text-text-secondary rounded-sm text-[11px] hover:border-border-gold hover:text-gold transition-all">
                  カルテ
                </Link>
                <IssueIdModal userId={m.id} loginId={m.loginId} nameKana={m.nameKana || ""} isIdIssued={m.isIdIssued} />
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-text-muted text-sm">
            該当する会員が見つかりません
          </div>
        )}
      </div>

      {/* PC: テーブル */}
      <div className="hidden sm:block bg-bg-secondary border border-border rounded-md overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              {["会員番号", "氏名", "iPSステータス", "入金状況", "契約日", "ID", ""].map((h, i) => (
                <th
                  key={i}
                  className="px-5 py-3.5 text-left text-[11px] text-text-muted tracking-wider font-normal"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr
                key={m.id}
                className="border-b border-border transition-colors duration-200 hover:bg-bg-elevated"
              >
                <td className="px-5 py-3.5 font-mono text-[13px] text-gold">
                  {m.membership?.memberNumber || "---"}
                </td>
                <td className="px-5 py-3.5 text-[13px]">{m.name}</td>
                <td className="px-5 py-3.5">
                  <span className="text-[11px] px-2.5 py-1 rounded-full bg-gold/10 text-gold border border-gold/20">
                    {m.membership ? IPS_STATUS_LABELS[m.membership.ipsStatus] : "---"}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className={`text-[11px] ${
                      m.membership
                        ? paymentColors[m.membership.paymentStatus] || "text-text-secondary"
                        : "text-text-secondary"
                    }`}
                  >
                    {m.membership ? PAYMENT_STATUS_LABELS[m.membership.paymentStatus] : "---"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-text-muted font-mono">
                  {m.membership
                    ? new Date(m.membership.contractDate).toLocaleDateString("ja-JP")
                    : "---"}
                </td>
                <td className="px-5 py-3.5">
                  <IssueIdModal userId={m.id} loginId={m.loginId} nameKana={m.nameKana || ""} isIdIssued={m.isIdIssued} />
                </td>
                <td className="px-5 py-3.5">
                  <Link
                    href={`/admin/members/${m.id}`}
                    className="px-3 py-1 bg-transparent border border-border text-text-secondary rounded-sm text-[11px] hover:border-border-gold hover:text-gold transition-all duration-300"
                  >
                    カルテ
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-text-muted text-sm">
                  該当する会員が見つかりません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
