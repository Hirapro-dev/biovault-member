/**
 * /form-preview-b のレイアウト
 *
 * デザイン案B(黒×ゴールド)のプレビュー用。
 * page.tsx をクライアントコンポーネント化したため metadata はここで定義します。
 */

export const metadata = {
  title: "iPS細胞作製の適合確認申請 - デザイン案B(黒×ゴールド)",
  robots: {
    index: false,
    follow: false,
  },
};

export default function FormPreviewBLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
