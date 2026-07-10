import { requireStaff } from "@/lib/auth-helpers";
import LeadTable from "@/components/affiliate/LeadTable";

// 紹介協力リード一覧（営業スタッフ用・adminと同一リスト）
export default async function StaffAffiliateLeadsPage() {
  await requireStaff();

  return (
    <div>
      <h2 className="font-serif-jp text-lg sm:text-[22px] font-normal text-text-primary tracking-[2px] mb-5 sm:mb-7">
        紹介協力 リード一覧
      </h2>
      <p className="text-[12px] text-text-muted mb-4 leading-relaxed">
        紹介協力者（アフィリエイター）経由で登録された見込み顧客の一覧です。
        架電結果を「繋がった」で保存すると、適合確認フォームの案内メールが自動送信されます。
      </p>
      <LeadTable apiBase="/api/staff/affiliate-leads" />
    </div>
  );
}
