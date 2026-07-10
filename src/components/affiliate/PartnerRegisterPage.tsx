import GaTag from "@/components/affiliate/GaTag";
import PartnerRegisterForm from "@/components/affiliate/PartnerRegisterForm";

// 協力者登録ページの共通レイアウト（nw / kawara の2ルートから利用）
// iPS適合確認フォームと同じ v2 デザイン（V2Wrapper）を使用する
export default function PartnerRegisterPage({ channel }: { channel: "NW" | "KAWARA" }) {
  return (
    <>
      <GaTag />
      <PartnerRegisterForm channel={channel} />
    </>
  );
}
