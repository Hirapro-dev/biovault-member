/**
 * V2Button
 *
 * デザイン刷新版(v2)の汎用ボタン。
 * variant="primary" でゴールドグラデーション、"secondary" で枠線のみ。
 *
 * 本コンポーネントは新規作成。既存ボタンには影響しません。
 */

type V2ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
};

export default function V2Button({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  onClick,
}: V2ButtonProps) {
  const className = variant === "primary" ? "v2-btn-primary" : "v2-btn-secondary";
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={className}>
      {children}
    </button>
  );
}
