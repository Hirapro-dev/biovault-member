import { requireAuth } from "@/lib/auth-helpers";
import prisma from "@/lib/prisma";
import AgreeForm from "./AgreeForm";
import Link from "next/link";

export default async function ImportantNoticePage() {
  const sessionUser = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { hasAgreedTerms: true, agreedTermsAt: true },
  });

  // 同意済みの場合は閲覧モード
  const isAgreed = user?.hasAgreedTerms || false;

  return (
    <div className="max-w-[760px] mx-auto">
      {isAgreed && (
        <div className="text-[11px] text-text-muted mb-5">
          <Link href="/documents" className="hover:text-gold transition-colors">契約書類</Link>
          <span className="mx-2">/</span>
          <span className="text-text-secondary">重要事項説明</span>
        </div>
      )}

      <AgreeForm isAgreed={isAgreed} agreedAt={user?.agreedTermsAt?.toISOString() || null} />
    </div>
  );
}
