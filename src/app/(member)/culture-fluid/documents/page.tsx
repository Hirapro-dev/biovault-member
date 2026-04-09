import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import DocumentModal from "../../mypage/DocumentModal";

// 日付フォーマット
const formatDate = (d: Date | string | null) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
};

// 金額フォーマット
const formatAmount = (amount: number) =>
  new Intl.NumberFormat("ja-JP").format(amount);

export default async function CultureFluidDocumentsPage() {
  const user = await requireAuth();

  // 全注文を取得（新しい順）
  const orders = await prisma.cultureFluidOrder.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // 最新の注文を取得（同意状況の判定用）
  const latestOrder = orders[0] || null;
  const cautionAgreedAt = orders.find((o) => o.cautionAgreedAt)?.cautionAgreedAt || null;
  const informedAgreedAt = orders.find((o) => o.informedAgreedAt)?.informedAgreedAt || null;

  return (
    <div>
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/culture-fluid" className="hover:text-gold transition-colors">培養上清液</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">契約書類</span>
      </div>

      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        iPS培養上清液 契約・同意事項書類一覧
      </h2>

      <div className="flex flex-col gap-3 mb-8">
        {/* 001: iPS培養上清液に関する留意事項 */}
        <div className="bg-bg-secondary border border-border rounded-md px-4 py-4 sm:px-7 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors duration-300 hover:border-border-gold">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-bg-elevated flex items-center justify-center text-[10px] sm:text-xs text-gold font-mono shrink-0">
              001
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base text-text-primary leading-snug">
                iPS培養上清液に関する留意事項
              </div>
              {cautionAgreedAt && (
                <div className="text-xs text-text-secondary mt-0.5">
                  同意日: {formatDate(cautionAgreedAt)}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 pl-11 sm:pl-0">
            <Badge variant={cautionAgreedAt ? "success" : "muted"}>
              {cautionAgreedAt ? "同意済" : "未同意"}
            </Badge>
            {cautionAgreedAt && (
              <DocumentModal
                label="iPS培養上清液に関する留意事項"
                pageUrl="/culture-fluid/caution"
                done={true}
                triggerLabel="内容を確認"
                variant="button"
              />
            )}
          </div>
        </div>

        {/* 002: 自家iPS培養上清液に関する説明書兼同意書 */}
        <div className="bg-bg-secondary border border-border rounded-md px-4 py-4 sm:px-7 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors duration-300 hover:border-border-gold">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-bg-elevated flex items-center justify-center text-[10px] sm:text-xs text-gold font-mono shrink-0">
              002
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base text-text-primary leading-snug">
                自家iPS培養上清液に関する説明書兼同意書
              </div>
              {informedAgreedAt && (
                <div className="text-xs text-text-secondary mt-0.5">
                  同意日: {formatDate(informedAgreedAt)}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 pl-11 sm:pl-0">
            <Badge variant={informedAgreedAt ? "success" : "muted"}>
              {informedAgreedAt ? "同意済" : "未同意"}
            </Badge>
            {informedAgreedAt && (
              <DocumentModal
                label="自家iPS培養上清液に関する説明書兼同意書"
                pageUrl="/culture-fluid/documents/informed-consent"
                done={true}
                triggerLabel="内容を確認"
                variant="button"
              />
            )}
          </div>
        </div>
      </div>

      {/* 購入プラン記録 */}
      <h3 className="font-serif-jp text-base sm:text-lg font-normal text-text-primary tracking-wider mb-4 mt-2 pb-3 border-b border-border">
        購入プラン記録
      </h3>
      {orders.length === 0 ? (
        <div className="bg-bg-secondary border border-border rounded-md p-6 text-center">
          <p className="text-sm text-text-muted">購入プランの記録はありません</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order, i) => (
            <div
              key={order.id}
              className="bg-bg-secondary border border-border rounded-md px-4 py-4 sm:px-7 sm:py-5"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-bg-elevated flex items-center justify-center text-[10px] sm:text-xs text-gold font-mono shrink-0">
                  {String(orders.length - i).padStart(3, "0")}
                </span>
                <span className="text-sm sm:text-base text-text-primary font-medium">
                  {order.planLabel}
                </span>
                <span className="text-sm text-gold font-mono">
                  ¥{formatAmount(order.totalAmount)}
                </span>
                {order.status === "COMPLETED" ? (
                  <Badge variant="success">完了</Badge>
                ) : (
                  <Badge variant="warning">進行中</Badge>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pl-11 sm:pl-12 text-[11px]">
                <div>
                  <div className="text-text-muted mb-0.5">購入日</div>
                  <div className="text-text-secondary font-mono">{formatDate(order.createdAt)}</div>
                </div>
                {order.paidAt && (
                  <div>
                    <div className="text-text-muted mb-0.5">入金日</div>
                    <div className="text-text-secondary font-mono">{formatDate(order.paidAt)}</div>
                  </div>
                )}
                {order.producedAt && (
                  <div>
                    <div className="text-text-muted mb-0.5">精製完了日</div>
                    <div className="text-text-secondary font-mono">{formatDate(order.producedAt)}</div>
                  </div>
                )}
                {order.expiresAt && (
                  <div>
                    <div className="text-text-muted mb-0.5">管理期限</div>
                    <div className="text-text-secondary font-mono">{formatDate(order.expiresAt)}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 注文がない場合の補助表示 */}
      {!latestOrder && (
        <div className="mt-6 bg-bg-secondary border border-border rounded-md p-8 text-center">
          <div className="text-3xl mb-3">🧪</div>
          <p className="text-sm text-text-muted">まだ培養上清液のご注文がありません</p>
          <p className="text-xs text-text-muted mt-1">
            申込後、各書類の内容を確認できるようになります
          </p>
        </div>
      )}
    </div>
  );
}
