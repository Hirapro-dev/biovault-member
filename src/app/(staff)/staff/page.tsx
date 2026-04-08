import { requireStaff } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { IPS_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/types";
import StaffFormUrl from "./StaffFormUrl";

// 手続き必要な顧客の判定ロジック
function getActionRequired(c: {
  name: string;
  membership: {
    memberNumber: string;
    ipsStatus: string;
    paymentStatus: string;
    clinicDate: Date | null;
    contractSignedAt: Date | null;
  } | null;
  cultureFluidOrders: { status: string; paymentStatus: string }[];
}): { label: string; urgency: "high" | "medium" | "low" } | null {
  const m = c.membership;
  if (!m) return null;

  // 契約書署名待ち
  if (m.ipsStatus === "SERVICE_APPLIED" && !m.contractSignedAt) {
    return { label: "契約書署名待ち", urgency: "high" };
  }
  // 入金確認待ち
  if (m.ipsStatus === "SERVICE_APPLIED" && m.contractSignedAt && m.paymentStatus !== "COMPLETED") {
    return { label: "入金確認待ち", urgency: "high" };
  }
  // 日程調整中（クリニック未確定）
  if (m.ipsStatus === "SCHEDULE_ARRANGED" && !m.clinicDate) {
    return { label: "クリニック日程調整中", urgency: "medium" };
  }
  // 培養上清液の入金待ち
  const cfPending = c.cultureFluidOrders.find(o => o.status === "APPLIED" && o.paymentStatus !== "COMPLETED");
  if (cfPending) {
    return { label: "培養上清液 入金確認待ち", urgency: "medium" };
  }
  // 培養上清液の予約手配
  const cfBooking = c.cultureFluidOrders.find(o => o.status === "PRODUCING" || o.status === "CLINIC_BOOKING");
  if (cfBooking) {
    return { label: "培養上清液 予約手配", urgency: "low" };
  }

  return null;
}

export default async function StaffDashboardPage() {
  const { staffCode, name } = await requireStaff();

  // 担当顧客のみ取得（培養上清液注文も含む）
  const customers = await prisma.user.findMany({
    where: { referredByStaff: staffCode, role: "MEMBER" },
    include: {
      membership: true,
      cultureFluidOrders: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalCustomers = customers.length;
  const paidAmount = customers.reduce((sum, c) => sum + (c.membership?.paidAmount || 0), 0);
  const paymentCompleted = customers.filter(c => c.membership?.paymentStatus === "COMPLETED").length;

  // 今月の新規
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthNew = customers.filter(c => new Date(c.createdAt) >= monthStart).length;

  // 手続きが必要な顧客
  const actionRequired = customers
    .map(c => {
      const action = getActionRequired(c);
      return action ? { user: c, action } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // ステータス別集計
  const statusCounts: Record<string, number> = {};
  for (const c of customers) {
    const st = c.membership?.ipsStatus || "REGISTERED";
    statusCounts[st] = (statusCounts[st] || 0) + 1;
  }

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        ダッシュボード
      </h2>
      <p className="text-sm text-text-muted mb-6">{name}（{staffCode}）の担当顧客データ</p>

      {/* 専用申込フォームURL */}
      <StaffFormUrl staffCode={staffCode} />

      {/* 統計カード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard label="担当顧客数" value={String(totalCustomers)} unit="名" />
        <StatCard label="入金完了" value={String(paymentCompleted)} unit="名" color="text-status-active" />
        <StatCard label="入金済売上" value={`¥${paidAmount.toLocaleString()}`} />
        <StatCard label="今月新規" value={String(thisMonthNew)} unit="名" color="text-gold" />
      </div>

      {/* 手続きが必要な顧客 */}
      {actionRequired.length > 0 && (
        <div className="bg-bg-secondary border border-status-warning/30 rounded-md p-4 sm:p-6 mb-8">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
            <span className="text-lg">⚠️</span>
            <h3 className="font-serif-jp text-sm text-status-warning tracking-wider">手続きが必要な顧客（{actionRequired.length}件）</h3>
          </div>
          <div className="divide-y divide-border">
            {actionRequired.map(({ user: c, action }) => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] text-gold">{c.membership?.memberNumber || "---"}</span>
                    <span className="text-sm text-text-primary">{c.name}</span>
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {c.membership ? IPS_STATUS_LABELS[c.membership.ipsStatus] : "---"}
                  </div>
                </div>
                <span className={`text-[10px] px-2.5 py-1 rounded-full border shrink-0 ${
                  action.urgency === "high"
                    ? "bg-status-danger/10 text-status-danger border-status-danger/20"
                    : action.urgency === "medium"
                    ? "bg-status-warning/10 text-status-warning border-status-warning/20"
                    : "bg-gold/10 text-gold border-gold/20"
                }`}>
                  {action.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ステータス別ファネル */}
      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6 mb-8">
        <h3 className="font-serif-jp text-sm text-gold tracking-wider mb-4 pb-3 border-b border-border">ステータス別</h3>
        <div className="space-y-2">
          {["REGISTERED", "TERMS_AGREED", "SERVICE_APPLIED", "SCHEDULE_ARRANGED", "BLOOD_COLLECTED", "IPS_CREATING", "STORAGE_ACTIVE"].map(st => {
            const count = statusCounts[st] || 0;
            const pct = totalCustomers > 0 ? (count / totalCustomers) * 100 : 0;
            return (
              <div key={st} className="flex items-center gap-3">
                <div className="w-40 text-[11px] text-text-muted truncate">{IPS_STATUS_LABELS[st as keyof typeof IPS_STATUS_LABELS] || st}</div>
                <div className="flex-1 h-4 bg-bg-elevated rounded-full overflow-hidden">
                  <div className="h-full bg-gold/40 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="w-8 text-right font-mono text-[11px] text-text-secondary">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 最近の担当顧客 */}
      <div className="bg-bg-secondary border border-border rounded-md p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <h3 className="font-serif-jp text-sm text-gold tracking-wider">最近の担当顧客</h3>
          <Link href="/staff/members" className="text-[11px] text-text-muted hover:text-gold transition-colors">すべて見る →</Link>
        </div>
        {customers.length === 0 ? (
          <div className="text-text-muted text-sm py-4 text-center">担当顧客なし</div>
        ) : (
          <div className="divide-y divide-border">
            {customers.slice(0, 10).map((c) => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] text-gold">{c.membership?.memberNumber || "---"}</span>
                    <span className="text-sm text-text-primary">{c.name}</span>
                  </div>
                  <div className="text-[11px] text-text-muted mt-0.5">
                    {c.membership ? IPS_STATUS_LABELS[c.membership.ipsStatus] : "---"} ・ {c.membership ? PAYMENT_STATUS_LABELS[c.membership.paymentStatus] : "---"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, color }: { label: string; value: string; unit?: string; color?: string }) {
  return (
    <div className="bg-bg-secondary border border-border rounded-md p-4 text-center">
      <div className="text-[10px] text-text-muted tracking-wider mb-1">{label}</div>
      <div className={`font-mono text-xl ${color || "text-text-primary"}`}>{value}</div>
      {unit && <div className="text-[10px] text-text-muted">{unit}</div>}
    </div>
  );
}
