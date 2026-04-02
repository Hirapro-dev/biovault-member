import { requireAdmin } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "申込受付", color: "bg-status-warning/10 text-status-warning border-status-warning/20" },
  REVIEWING: { label: "iPS細胞作製適合確認中", color: "bg-status-info/10 text-status-info border-status-info/20" },
  APPROVED: { label: "承認済", color: "bg-gold/10 text-gold border-gold/20" },
  REGISTERED: { label: "会員登録済", color: "bg-status-active/10 text-status-active border-status-active/20" },
  REJECTED: { label: "却下", color: "bg-status-danger/10 text-status-danger border-status-danger/20" },
};

export default async function AdminApplicationsPage() {
  await requireAdmin();

  const applications = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        申込管理
      </h2>

      {/* モバイル: カードリスト */}
      <div className="flex flex-col gap-3 sm:hidden">
        {applications.map((app) => {
          const st = STATUS_LABELS[app.status] || STATUS_LABELS.PENDING;
          return (
            <Link
              key={app.id}
              href={`/admin/applications/${app.id}`}
              className="block bg-bg-secondary border border-border rounded-md p-4 transition-colors active:border-border-gold"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-primary font-medium">{app.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
              </div>
              <div className="text-xs text-text-muted">{app.email}</div>
              <div className="text-[11px] text-text-muted font-mono mt-1">
                {new Date(app.createdAt).toLocaleDateString("ja-JP")}
              </div>
            </Link>
          );
        })}
        {applications.length === 0 && (
          <div className="py-12 text-center text-text-muted text-sm">申込はありません</div>
        )}
      </div>

      {/* PC: テーブル */}
      <div className="hidden sm:block bg-bg-secondary border border-border rounded-md overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              {["申込日", "氏名", "メール", "電話番号", "ステータス", ""].map((h, i) => (
                <th key={i} className="px-5 py-3.5 text-left text-[11px] text-text-muted tracking-wider font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => {
              const st = STATUS_LABELS[app.status] || STATUS_LABELS.PENDING;
              return (
                <tr key={app.id} className="border-b border-border hover:bg-bg-elevated transition-colors">
                  <td className="px-5 py-3.5 text-xs text-text-muted font-mono">
                    {new Date(app.createdAt).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-5 py-3.5 text-sm">{app.name}</td>
                  <td className="px-5 py-3.5 text-xs text-text-secondary">{app.email}</td>
                  <td className="px-5 py-3.5 text-xs text-text-secondary">{app.phone}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/applications/${app.id}`}
                      className="px-3 py-1 bg-transparent border border-border text-text-secondary rounded-sm text-[11px] hover:border-border-gold hover:text-gold transition-all"
                    >
                      詳細
                    </Link>
                  </td>
                </tr>
              );
            })}
            {applications.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-text-muted text-sm">申込はありません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
