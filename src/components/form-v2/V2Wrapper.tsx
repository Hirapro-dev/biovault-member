/**
 * V2Wrapper
 *
 * デザイン刷新版(v2)のページラッパー。
 * 最外側で `.v2-scope` を付与し、v2-theme.css のスタイルを有効化します。
 * ヘッダーは黒帯 + ゴールド下線 + 2行ブランドロックアップ
 * ("BioVault" + "Membership Service")で構成。
 *
 * フッターには契約主体スキーム(SCPP / MRT)に応じたコピーライト表記を表示します。
 * - SCPP: © 2025 SCPP Inc. All Rights Reserved.
 * - MRT : © 2025 MRT Inc. All Rights Reserved.
 *
 * 本コンポーネントは新規作成。既存のレイアウト・ヘッダーには影響しません。
 */

import "@/app/v2-theme.css";
import type { SchemeKey } from "@/lib/scheme";

type V2WrapperProps = {
  children: React.ReactNode;
  brandName?: string;
  tagline?: string;
  /** 流入スキーム(契約主体)。フッターのコピーライト会社名切替に使用。 */
  scheme?: SchemeKey;
};

export default function V2Wrapper({
  children,
  brandName = "BioVault",
  tagline = "Membership Service",
  scheme = "SCPP",
}: V2WrapperProps) {
  const companyShortName = scheme === "MRT" ? "MRT Inc." : "SCPP Inc.";
  return (
    <div
      className="v2-scope"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <header className="v2-header">
        <div className="v2-header-inner">
          <div className="v2-header-brand">{brandName}</div>
          <div className="v2-header-tagline">{tagline}</div>
        </div>
      </header>
      <main className="v2-main" style={{ flex: 1 }}>{children}</main>
      <footer className="v2-footer">
        <div className="v2-footer-inner">
          © 2025 {companyShortName} All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
