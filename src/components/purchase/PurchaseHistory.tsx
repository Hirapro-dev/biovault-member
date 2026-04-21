import prisma from "@/lib/prisma";
import { PAYMENT_STATUS_LABELS, TREATMENT_TYPE_LABELS } from "@/types";

const CF_STATUS_LABELS: Record<string, string> = {
  APPLIED: "申込済",
  PAYMENT_CONFIRMED: "入金済",
  PRODUCING: "精製中",
  CLINIC_BOOKING: "予約手配中",
  INFORMED_AGREED: "同意済",
  RESERVATION_CONFIRMED: "予約確定",
  COMPLETED: "施術完了",
};

const CF_STATUS_COLORS: Record<string, string> = {
  APPLIED: "bg-blue-500/15 text-blue-400",
  PAYMENT_CONFIRMED: "bg-emerald-500/15 text-emerald-400",
  PRODUCING: "bg-amber-500/15 text-amber-400",
  CLINIC_BOOKING: "bg-purple-500/15 text-purple-400",
  INFORMED_AGREED: "bg-cyan-500/15 text-cyan-400",
  RESERVATION_CONFIRMED: "bg-indigo-500/15 text-indigo-400",
  COMPLETED: "bg-status-active/15 text-status-active",
};

const fmtDate = (d: Date | null | undefined) =>
  d ? d.toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }) : "---";

const fmtAmount = (n: number) => `¥${n.toLocaleString()}`;

interface Props {
  userId: string;
}

export default async function PurchaseHistory({ userId }: Props) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      membership: {
        include: { treatments: { orderBy: { createdAt: "desc" } } },
      },
      cultureFluidOrders: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!user) return null;

  const membership = user.membership;
  // iPSサービス付属分は、iPS契約の入金が完了するまで非表示
  const orders = user.cultureFluidOrders.filter(
    (o) => o.planType !== "iv_drip_1_included" || membership?.paymentStatus === "COMPLETED"
  );
  const treatments = membership?.treatments || [];

  // 統合タイムラインを構築
  type TimelineItem = {
    date: Date;
    type: "contract" | "order" | "treatment";
    label: string;
    amount: number | null;
    status: string | null;
    statusColor: string;
    details: string[];
  };

  const items: TimelineItem[] = [];

  // 基本契約
  if (membership) {
    items.push({
      date: membership.contractDate,
      type: "contract",
      label: "iPS作製・保管 基本パッケージ",
      amount: membership.totalAmount,
      status: PAYMENT_STATUS_LABELS[membership.paymentStatus] || null,
      statusColor: membership.paymentStatus === "COMPLETED" ? "text-status-active" : membership.paymentStatus === "PARTIAL" ? "text-status-warning" : "text-status-danger",
      details: [
        `入金額: ${fmtAmount(membership.paidAmount)} / ${fmtAmount(membership.totalAmount)}`,
        `会員番号: ${membership.memberNumber}`,
      ],
    });
  }

  // 培養上清液注文
  for (const order of orders) {
    items.push({
      date: order.createdAt,
      type: "order",
      label: order.planLabel,
      amount: order.totalAmount,
      status: CF_STATUS_LABELS[order.status] || order.status,
      statusColor: "",
      details: [
        order.paidAt ? `入金日: ${fmtDate(order.paidAt)}` : "未入金",
        ...(order.clinicName ? [`クリニック: ${order.clinicName}`] : []),
        ...(order.completedAt ? [`施術完了日: ${fmtDate(order.completedAt)}`] : []),
        ...(order.completedSessions > 0 ? [`施術回数: ${order.completedSessions}回`] : []),
      ],
    });
  }

  // 施術記録
  for (const t of treatments) {
    if (t.completedAt) {
      items.push({
        date: t.completedAt,
        type: "treatment",
        label: `培養上清液投与（${TREATMENT_TYPE_LABELS[t.type]}）`,
        amount: t.amount,
        status: "施術完了",
        statusColor: "text-status-active",
        details: [
          `容量: ${t.volume}ml`,
          ...(t.clinicName ? [`クリニック: ${t.clinicName}`] : []),
          ...(t.note ? [t.note] : []),
        ],
      });
    }
  }

  // 日付の新しい順にソート
  items.sort((a, b) => b.date.getTime() - a.date.getTime());

  const typeIcons: Record<string, string> = {
    contract: "📋",
    order: "🧪",
    treatment: "💉",
  };

  const typeLabels: Record<string, string> = {
    contract: "基本契約",
    order: "培養上清液注文",
    treatment: "施術記録",
  };

  if (items.length === 0) {
    return (
      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
        <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
          購入履歴
        </h3>
        <div className="text-text-muted text-sm py-4 text-center">購入履歴はありません</div>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
      <h3 className="font-serif-jp text-sm font-normal text-gold tracking-wider mb-4 pb-3 border-b border-border">
        購入履歴 ({items.length}件)
      </h3>

      <div className="divide-y divide-border">
        {items.map((item, i) => (
          <div key={`${item.type}-${i}`} className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{typeIcons[item.type]}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-bg-elevated text-text-muted border border-border">
                    {typeLabels[item.type]}
                  </span>
                  {item.status && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      item.type === "order" ? (CF_STATUS_COLORS[orders.find((_, idx) => idx === i - (membership ? 1 : 0))?.status || ""] || "bg-bg-elevated text-text-muted") : ""
                    } ${item.statusColor}`}>
                      {item.status}
                    </span>
                  )}
                </div>
                <div className="text-sm text-text-primary">{item.label}</div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                  {item.details.map((d, j) => (
                    <span key={j} className="text-[10px] text-text-muted">{d}</span>
                  ))}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] text-text-muted">{fmtDate(item.date)}</div>
                {item.amount !== null && item.amount > 0 && (
                  <div className="font-mono text-sm text-gold">{fmtAmount(item.amount)}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
