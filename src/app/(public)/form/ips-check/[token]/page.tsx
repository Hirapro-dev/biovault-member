import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import GaTag from "@/components/affiliate/GaTag";
import V2Wrapper from "@/components/form-v2/V2Wrapper";
import IpsCheckForm from "./IpsCheckForm";

export const metadata: Metadata = {
  title: "iPS細胞作製 適合確認申請 | BioVault",
  robots: { index: false },
};

// リード専用URL（トークン式）の適合確認フォーム
// LP登録時の情報（メール・住所・職業）は再取得せず、本人確認＋健康状態のみ入力する
export default async function IpsCheckPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const lead = await prisma.affiliateLead.findUnique({
    where: { formToken: token },
    select: {
      id: true,
      name: true,
      phone: true,
      applicationId: true,
      affiliateProfile: { select: { status: true } },
    },
  });

  // 無効なトークン
  if (!lead) {
    return (
      <V2Wrapper scheme="MRT" compact>
        <GaTag />
        <div className="v2-form-container" style={{ paddingTop: 56, paddingBottom: 56 }}>
          <section className="v2-section" style={{ textAlign: "center" }}>
            <h2 className="v2-section-title" style={{ textAlign: "center" }}>
              URLが無効です
            </h2>
            <p style={{ fontSize: 14, color: "var(--v2-text-secondary)", lineHeight: 1.9 }}>
              このURLは無効か、有効期限が切れています。
              <br />
              お手数ですが、ご案内メールに記載のURLをご確認いただくか、
              <br />
              担当者までお問い合わせください。
            </p>
          </section>
        </div>
      </V2Wrapper>
    );
  }

  // 提出済み
  if (lead.applicationId) {
    return (
      <V2Wrapper scheme="MRT" compact>
        <GaTag />
        <div className="v2-form-container" style={{ paddingTop: 56, paddingBottom: 56 }}>
          <section className="v2-section" style={{ textAlign: "center" }}>
            <h2 className="v2-section-title" style={{ textAlign: "center" }}>
              すでに申請済みです
            </h2>
            <p style={{ fontSize: 14, color: "var(--v2-text-secondary)", lineHeight: 1.9 }}>
              このURLからの適合確認申請は完了しています。
              <br />
              確認結果は担当者よりご連絡いたしますので、今しばらくお待ちください。
            </p>
          </section>
        </div>
      </V2Wrapper>
    );
  }

  return (
    <>
      <GaTag />
      <IpsCheckForm token={token} leadName={lead.name} leadPhone={lead.phone} />
    </>
  );
}
