import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import { PAYMENT_STATUS_LABELS } from "@/types";
import Link from "next/link";
import MemberSearch from "./MemberSearch";

// タイムラインに合わせたステータス表示を生成
function getDisplayStatus(m: {
  isIdIssued: boolean;
  hasAgreedTerms: boolean;
  membership: { ipsStatus: string; paymentStatus: string } | null;
  documents: { type: string; status: string }[];
}): { label: string; color: string } {
  if (!m.membership) return { label: "---", color: "text-text-muted" };

  const status = m.membership.ipsStatus;
  const payment = m.membership.paymentStatus;
  const signedTypes = m.documents.filter(d => d.status === "SIGNED").map(d => d.type);

  // 後ろから判定（最も進んでいるステップを表示）
  if (status === "STORAGE_ACTIVE") return { label: "iPS細胞 保管中", color: "text-status-active" };
  if (status === "IPS_CREATING") return { label: "iPS細胞 作製中", color: "text-gold" };
  if (status === "BLOOD_COLLECTED") return { label: "問診・採血済", color: "text-gold" };

  if (status === "SCHEDULE_ARRANGED") {
    if (signedTypes.includes("INFORMED_CONSENT")) return { label: "IC同意済", color: "text-gold" };
    if (signedTypes.includes("CELL_STORAGE_CONSENT")) return { label: "細胞提供同意済", color: "text-gold" };
    return { label: "クリニック日程調整中", color: "text-gold" };
  }

  if (status === "SERVICE_APPLIED") {
    if (payment === "COMPLETED") return { label: "入金完了", color: "text-status-active" };
    return { label: "入金待ち", color: "text-status-warning" };
  }

  if (status === "TERMS_AGREED") {
    if (m.hasAgreedTerms) return { label: "重要事項同意済", color: "text-gold" };
    if (m.isIdIssued) return { label: "ID発行済", color: "text-gold" };
    return { label: "適合確認済", color: "text-gold" };
  }

  if (status === "REGISTERED") {
    if (m.isIdIssued) return { label: "ID発行済", color: "text-gold" };
    return { label: "適合確認待ち", color: "text-text-muted" };
  }

  return { label: "申込受付", color: "text-text-muted" };
}

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
    include: {
      membership: true,
      documents: { select: { type: true, status: true } },
    },
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
        {filtered.map((m) => {
          const ds = getDisplayStatus(m);
          return (
            <div key={m.id} className="bg-bg-secondary border border-border rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[13px] text-gold">
                  {m.membership?.memberNumber || "---"}
                </span>
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
              <div className="text-sm text-text-primary mb-2">{m.name}</div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 ${ds.color}`}>
                  {ds.label}
                </span>
                <Link href={`/admin/members/${m.id}`} className="px-3 py-1 bg-transparent border border-border text-text-secondary rounded-sm text-[11px] hover:border-border-gold hover:text-gold transition-all">
                  カルテ
                </Link>
              </div>
            </div>
          );
        })}
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
              {["会員番号", "氏名", "現在のステップ", "入金状況", "申込日", ""].map((h, i) => (
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
            {filtered.map((m) => {
              const ds = getDisplayStatus(m);
              return (
                <tr
                  key={m.id}
                  className="border-b border-border transition-colors duration-200 hover:bg-bg-elevated"
                >
                  <td className="px-5 py-3.5 font-mono text-[13px] text-gold">
                    {m.membership?.memberNumber || "---"}
                  </td>
                  <td className="px-5 py-3.5 text-[13px]">{m.name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20 ${ds.color}`}>
                      {ds.label}
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
                    {new Date(m.createdAt).toLocaleDateString("ja-JP")}
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
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-text-muted text-sm">
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
