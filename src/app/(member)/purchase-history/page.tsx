import { requireAuth } from "@/lib/auth-helpers";
import PurchaseHistory from "@/components/purchase/PurchaseHistory";

export default async function PurchaseHistoryPage() {
  const user = await requireAuth();

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        購入履歴
      </h2>
      <PurchaseHistory userId={user.id} />
    </div>
  );
}
