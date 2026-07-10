import type { Metadata } from "next";
import GaTag from "@/components/affiliate/GaTag";
import LeadForm from "./LeadForm";

export const metadata: Metadata = {
  title: "無料適合確認のお申込み | BioVault",
  description: "iPS細胞作製適合検査の無料適合確認のお申込みフォームです。",
  robots: { index: false },
};

// LP経由のリード登録フォーム（iPS適合確認フォームと同じv2デザイン）
export default async function LeadEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  return (
    <>
      <GaTag />
      <LeadForm refCode={ref || ""} />
    </>
  );
}
