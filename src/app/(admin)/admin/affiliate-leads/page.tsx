import { requireAdmin } from "@/lib/auth-helpers";
import Link from "next/link";
import LeadTable from "@/components/affiliate/LeadTable";

// 紹介協力リード一覧（admin用・staffと同一リスト）
export default async function AdminAffiliateLeadsPage() {
  await requireAdmin();

  return (
    <div>
      <div className="mb-5 sm:mb-7">
        <Link href="/admin/affiliates" className="text-[12px] text-text-muted hover:text-gold">
          ← 紹介協力管理へ戻る
        </Link>
        <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mt-2">
          紹介協力 リード一覧
        </h2>
      </div>
      <LeadTable apiBase="/api/admin/affiliate-leads" />
    </div>
  );
}
