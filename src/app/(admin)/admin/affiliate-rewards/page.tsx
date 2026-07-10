import { requireAdmin } from "@/lib/auth-helpers";
import Link from "next/link";
import RewardTable from "@/components/affiliate/RewardTable";

// 紹介協力 報酬管理
export default async function AdminAffiliateRewardsPage() {
  await requireAdmin();

  return (
    <div>
      <div className="mb-5 sm:mb-7">
        <Link href="/admin/affiliates" className="text-[12px] text-text-muted hover:text-gold">
          ← 紹介協力管理へ戻る
        </Link>
        <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mt-2">
          紹介協力 報酬管理
        </h2>
      </div>
      <RewardTable />
    </div>
  );
}
