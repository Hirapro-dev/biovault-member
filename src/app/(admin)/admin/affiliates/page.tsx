import { requireAdmin } from "@/lib/auth-helpers";
import Link from "next/link";
import AffiliateList from "@/components/affiliate/AffiliateList";
import AffiliateSettingsPanel from "@/components/affiliate/AffiliateSettingsPanel";

// 紹介協力管理: 協力者一覧 + 制度設定
export default async function AdminAffiliatesPage() {
  await requireAdmin();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 sm:mb-7">
        <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px]">
          紹介協力管理
        </h2>
        <div className="flex gap-2">
          <Link
            href="/admin/affiliate-leads"
            className="px-3.5 py-1.5 rounded border border-border text-[12px] text-text-primary hover:border-gold transition-colors"
          >
            リード一覧
          </Link>
          <Link
            href="/admin/affiliate-rewards"
            className="px-3.5 py-1.5 rounded border border-border text-[12px] text-text-primary hover:border-gold transition-colors"
          >
            報酬管理
          </Link>
        </div>
      </div>

      <AffiliateSettingsPanel />
      <AffiliateList />

      <div className="mt-6 text-[11px] text-text-muted leading-relaxed">
        <p>登録フォーム: 人脈繋がり = /partner/register/nw ／ KAWARA版 = /partner/register/kawara</p>
      </div>
    </div>
  );
}
