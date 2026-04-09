import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import CautionContent from "@/components/culture-fluid/CautionContent";

export default async function CultureFluidCautionPage() {
  const sessionUser = await requireAuth();

  // 同意済みの最新注文があるか確認（cautionAgreedAt が設定されているもの）
  const latestOrder = await prisma.cultureFluidOrder.findFirst({
    where: { userId: sessionUser.id, cautionAgreedAt: { not: null } },
    orderBy: { cautionAgreedAt: "desc" },
    select: { cautionAgreedAt: true },
  });

  const isAgreed = !!latestOrder?.cautionAgreedAt;

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
