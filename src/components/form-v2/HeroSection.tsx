/**
 * HeroSection
 *
 * デザイン刷新版(v2)のヒーローセクション。
 * 左:タイトル+説明 / 右:長嶋一茂氏の人物画像 の2カラム構成。
 * モバイルでは縦積み(タイトル → 説明 → 画像)。
 *
 * compact=true を指定すると、モバイル幅ではタイトルのみを表示し、
 * 説明文と人物画像を非表示にする。
 * - フォーム Step2 以降のように、毎回スクロールしないとフォームに辿り着けない
 *   状況を回避するために使用する。
 * - PC では compact を無視して常にフル表示。
 *
 * 本コンポーネントは新規作成。既存の form/app/page.tsx には一切影響しません。
 * `.v2-scope` 配下で使用することを前提とします(v2-theme.css 参照)。
 */

import Image from "next/image";

type HeroSectionProps = {
  title: string;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
  /**
   * モバイル時にタイトルのみを表示する簡略表示モード(説明文・画像を非表示)。
   * PCでは無視され、常にフル表示される。
   */
  compact?: boolean;
};

export default function HeroSection({
  title,
  description,
  imageSrc = "/v2/nagashima01.png",
  imageAlt = "イメージキャラクター",
  compact = false,
}: HeroSectionProps) {
  return (
    <section className={`v2-hero${compact ? " is-compact" : ""}`}>
      <div className="v2-hero-grid">
        <div>
          <h1 className="v2-hero-title">{title}</h1>
          <p className="v2-hero-desc">{description}</p>
        </div>
        <div className="v2-hero-image-wrap">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={360}
            height={480}
            priority
            className="v2-hero-image"
            unoptimized
          />
        </div>
      </div>
    </section>
  );
}
