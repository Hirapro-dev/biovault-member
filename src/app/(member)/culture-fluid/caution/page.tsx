import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import CautionContent from "@/components/culture-fluid/CautionContent";
import CautionAgreeForm from "./CautionAgreeForm";

export default async function CultureFluidCautionPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; fromBooking?: string }>;
}) {
  const sessionUser = await requireAuth();
  const params = await searchParams;
  const orderId = params.orderId || "";
  const fromBooking = params.fromBooking === "1";

  // 同意済みの最新注文があるか確認（cautionAgreedAt が設定されているもの）
  const latestOrder = await prisma.cultureFluidOrder.findFirst({
    where: { userId: sessionUser.id, cautionAgreedAt: { not: null } },
    orderBy: { cautionAgreedAt: "desc" },
    select: { cautionAgreedAt: true },
  });

  // 指定された注文の同意状態を確認
  let targetOrderAgreed = false;
  if (orderId) {
    const targetOrder = await prisma.cultureFluidOrder.findFirst({
      where: { id: orderId, userId: sessionUser.id },
      select: { cautionAgreedAt: true },
    });
    targetOrderAgreed = !!targetOrder?.cautionAgreedAt;
  }

  const isAgreed = !!latestOrder?.cautionAgreedAt;

  // クリニック予約フローからの遷移で、対象注文がまだ未同意 → 同意フォームを表示
  if (fromBooking && orderId && !targetOrderAgreed) {
    return (
      <div className="max-w-[760px] mx-auto">
        <div className="text-[11px] text-text-muted mb-5">
          <Link href="/culture-fluid" className="hover:text-gold transition-colors">培養上清液</Link>
          <span className="mx-2">/</span>
          <span className="text-text-secondary">iPS培養上清液に関する留意事項</span>
        </div>

        <div className="mb-8">
          <h2 className="font-serif-jp text-lg sm:text-xl text-text-primary tracking-[2px] mb-4">
            iPS培養上清液に関する留意事項
          </h2>
          <p className="text-xs text-text-muted leading-relaxed">
            クリニック予約の前に、以下の留意事項をお読みいただき同意してください。
          </p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-7">
          <CautionAgreeForm orderId={orderId} />
        </div>
      </div>
    );
  }

  // 通常の閲覧モード（書類一覧からの遷移 or 同意済み）
  return (
    <div className="max-w-[760px] mx-auto">
      <div className="text-[11px] text-text-muted mb-5">
        <Link href="/culture-fluid" className="hover:text-gold transition-colors">培養上清液</Link>
        <span className="mx-2">/</span>
        <Link href="/culture-fluid/documents" className="hover:text-gold transition-colors">契約書類</Link>
        <span className="mx-2">/</span>
        <span className="text-text-secondary">iPS培養上清液に関する留意事項</span>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <h2 className="font-serif-jp text-lg text-text-primary tracking-[2px]">iPS培養上清液に関する留意事項</h2>
        {isAgreed && <Badge variant="success">同意済</Badge>}
      </div>
      {latestOrder?.cautionAgreedAt && (
        <div className="text-xs text-text-muted mb-5">
          同意日: {new Date(latestOrder.cautionAgreedAt).toLocaleDateString("ja-JP")}
        </div>
      )}

      <div className="bg-bg-secondary border border-border rounded-md p-5 sm:p-7">
        <article className="text-xs sm:text-sm text-text-secondary leading-[2] space-y-5">
          <CautionContent />
        </article>
      </div>
    </div>
  );
}
