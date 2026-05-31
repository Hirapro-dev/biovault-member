/**
 * /form-v2-preview のレイアウト
 *
 * page.tsx をクライアントコンポーネント化したため、
 * metadata export はこちらのサーバーコンポーネントで定義します。
 */

export const metadata = {
  title: "iPS細胞作製の適合確認申請 - デザインプレビュー",
  robots: {
    index: false,
    follow: false,
  },
};

export default function FormV2PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
