/**
 * V2Wrapper
 *
 * デザイン刷新版(v2)のページラッパー。
 * 最外側で `.v2-scope` を付与し、v2-theme.css のスタイルを有効化します。
 *
 * ヘッダーは form-header-bg のダークなウェーブ背景を敷いた「バナー」。
 * 内部に以下を内包します:
 *   - 左上: ブランドロックアップ(BioVault / Membership Service)
 *   - 中央左: ページタイトル(白文字・任意) + 区切り線
 *   - 右: 人物画像(任意・heroImageSrc 指定時のみ)
 *
 * title / heroImageSrc を省略した場合はロゴのみのシンプルなバナーになります
 * (サンクス画面など)。
 *
 * compact=true を指定すると、モバイル幅ではタイトル・区切り線・人物画像を
 * 非表示にし、ロゴのみの低いバナーへ簡略化します(フォーム Step2 以降など、
 * 毎回スクロールせずフォームへ辿り着けるようにするため)。PCでは無視されます。
 *
 * フッターには契約主体スキーム(SCPP / MRT)に応じたコピーライト表記を表示します。
 */

import "@/app/v2-theme.css";
import Image from "next/image";
import type { SchemeKey } from "@/lib/scheme";

type V2WrapperProps = {
  children: React.ReactNode;
  brandName?: string;
  tagline?: string;
  /** 流入スキーム(契約主体)。フッターのコピーライト会社名切替に使用。 */
  scheme?: SchemeKey;
  /** バナーに表示するページタイトル(白文字)。未指定ならロゴのみのバナー。 */
  title?: React.ReactNode;
  /** バナー右に表示する人物画像のパス。未指定なら非表示。 */
  heroImageSrc?: string;
  heroImageAlt?: string;
  /** モバイル時にバナーをロゴのみへ簡略化。PCでは無視。 */
  compact?: boolean;
  /** バナー内容の最大幅を広め(--v2-max-width)にする。未指定は通常幅(--v2-content-width)。 */
  headerWide?: boolean;
  /** バナー背景動画のパス。未指定は既存の /header-bg.mp4。 */
  headerVideoSrc?: string;
  /** バナーに追加するクラス名(ページ固有のスタイル調整用)。未指定なら付与しない。 */
  headerClassName?: string;
};

export default function V2Wrapper({
  children,
  brandName = "BioVault",
  tagline = "Membership Service",
  scheme = "SCPP",
  title,
  heroImageSrc,
  heroImageAlt = "イメージキャラクター",
  compact = false,
  headerWide = false,
  headerVideoSrc = "/header-bg.mp4",
  headerClassName = "",
}: V2WrapperProps) {
  const companyShortName = scheme === "MRT" ? "MRT Inc." : "SCPP Inc.";
  const headerClass = [
    "v2-header",
    heroImageSrc ? "has-hero" : "",
    title ? "has-title" : "",
    compact ? "is-compact" : "",
    headerWide ? "is-wide" : "",
    headerClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="v2-scope"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <header className={headerClass}>
        {/* バナー背景動画(poster の PNG が初期表示・フォールバック) */}
        <video
          className="v2-header-video"
          src={headerVideoSrc}
          poster="/form-header-bg.png"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className="v2-header-inner">
          <div className="v2-header-text">
            <div className="v2-header-logo">
              <div className="v2-header-brand">{brandName}</div>
              <div className="v2-header-tagline">{tagline}</div>
            </div>
            {title && (
              <>
                <h1 className="v2-banner-title">{title}</h1>
                <span className="v2-banner-line" />
              </>
            )}
          </div>
          {heroImageSrc && (
            <div className="v2-header-image">
              <Image
                src={heroImageSrc}
                alt={heroImageAlt}
                width={428}
                height={501}
                priority
                unoptimized
                style={{ width: "100%", height: "auto" }}
              />
            </div>
          )}
        </div>
      </header>
      <main className="v2-main" style={{ flex: 1 }}>
        {/* main 背景動画(装飾・最背面。透過・明度を落として控えめに) */}
        <div className="v2-aurora" aria-hidden="true">
          <video
            className="v2-bg-video"
            src="/main-bg.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
        {children}
      </main>
      <footer className="v2-footer">
        <div className="v2-footer-inner">
          © 2025 {companyShortName} All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
