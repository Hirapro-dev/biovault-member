import type { Metadata } from "next";
import PartnerRegisterPage from "@/components/affiliate/PartnerRegisterPage";

export const metadata: Metadata = {
  title: "ご紹介協力制度 登録フォーム | BioVault",
  robots: { index: false },
};

// KAWARA版チャネルの協力者登録
export default function PartnerRegisterKawaraPage() {
  return <PartnerRegisterPage channel="KAWARA" />;
}
