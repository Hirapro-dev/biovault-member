import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import StatusTimeline from "@/components/ui/StatusTimeline";
import { IPS_STATUS_LABELS, IPS_STATUS_DESCRIPTIONS, IPS_STATUS_ORDER } from "@/types";

export default async function StatusPage() {
  const user = await requireAuth();

  const membership = await prisma.membership.findUnique({
    where: { userId: user.id },
  });

  const statusHistory = await prisma.statusHistory.findMany({
    where: { userId: user.id },
    orderBy: { changedAt: "desc" },
  });

  if (!membership) {
    return (
      <div className="text-center py-20 text-text-muted">
        会員権情報が見つかりません
      </div>
    );
  }

  const currentIndex = IPS_STATUS_ORDER.indexOf(membership.ipsStatus);

  return (
    <div>
      <h2 className="font-serif-jp text-[22px] font-normal text-text-primary tracking-[2px] mb-7">
        ステータス詳細
      </h2>

      <StatusTimeline currentStatus={membership.ipsStatus} />

      {/* ステータス履歴 */}
      <div className="mt-8 bg-bg-secondary border border-border rounded-md p-7">
        <h3 className="font-serif-jp text-sm font-normal text-text-primary tracking-wider mb-4 pb-3 border-b border-border">
          ステータス履歴
        </h3>
        {IPS_STATUS_ORDER.slice(0, currentIndex + 1).map((status, i) => (
          <div
            key={status}
            className={`flex items-center gap-4 py-3.5 ${
              i < currentIndex ? "border-b border-border" : ""
            }`}
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{
                background:
                  i === currentIndex
                    ? "var(--color-gold-primary)"
                    : "var(--color-status-active)",
              }}
            />
            <div className="flex-1">
              <div
                className={`text-[13px] ${
                  i === currentIndex ? "text-gold" : "text-text-primary"
                }`}
              >
                {IPS_STATUS_LABELS[status]}
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">
                {IPS_STATUS_DESCRIPTIONS[status]}
              </div>
            </div>
            <div className="text-[11px] text-text-muted font-mono">
              {statusHistory.find((h) => h.toStatus === status)
                ? new Date(
                    statusHistory.find((h) => h.toStatus === status)!.changedAt
                  ).toLocaleDateString("ja-JP")
                : membership.contractDate
                ? new Date(membership.contractDate).toLocaleDateString("ja-JP")
                : "---"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
