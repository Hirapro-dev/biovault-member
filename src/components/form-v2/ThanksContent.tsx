/**
 * ThanksContent
 *
 * デザイン刷新版(v2)の申込完了サンクス画面のコンテンツ部分。
 *
 * レスポンシブ挙動:
 *  - PC(>=768px): 左テキスト + 右画像の2カラム
 *    タイトルは2行(「iPS細胞作製の適合確認申込を / 受け付けました」)
 *  - モバイル(<768px): 縦積み(タイトル → 説明 → 注意 → 画像 → お問い合わせカード)
 *    タイトルは3行(「iPS細胞作製の / 適合確認申込を / 受け付けました」)
 *
 * タイトルの行構成は <span class="v2-thanks-title-line"> を使って
 * モバイル時のみ表示する補助要素で実現します。PC時はその span を非表示にし、
 * 自然な2行レイアウト(「iPS細胞作製の適合確認申込を」+ <br> + 「受け付けました」)
 * に切り替えます。
 *
 * V2Wrapper の中に配置することを前提とします(.v2-scope 配下)。
 * フォーム送信完了画面とプレビュー用ルート /form-v2-preview/thanks の
 * 両方から使用されます。
 */

import Link from "next/link";
import Image from "next/image";
import { getCompany, type SchemeKey } from "@/lib/scheme";

type ThanksContentProps = {
  /** SCPP / MRT。お問い合わせカードの文言などで利用する余地を持たせる(現状は未使用) */
  scheme?: SchemeKey;
};

export default function ThanksContent({ scheme = "SCPP" }: ThanksContentProps) {
  // 将来お問い合わせカードに会社名や連絡先を出す可能性に備えて取得
  void getCompany(scheme);

  return (
    <div className="v2-thanks">
      <div className="v2-thanks-grid">
        <div className="v2-thanks-text">
          {/* タイトル
              モバイル: 3行(span.is-mobile-only が表示される)
              PC     : 2行(span.is-mobile-only は display:none、br.is-pc-only のみ表示) */}
          <h1 className="v2-thanks-title">
            <span className="v2-thanks-title-line">iPS細胞作製の</span>
            <span className="v2-thanks-title-line">適合確認申込を</span>
            <br className="v2-thanks-title-br-pc" />
            <span className="v2-thanks-title-line">受け付けました</span>
          </h1>

          <p className="v2-thanks-desc">
            お申し込みいただいた内容をもとに、本部にてiPS細胞作製適合確認を行います。
          </p>
          <p className="v2-thanks-desc">
            3営業日以内に、担当スタッフよりご連絡させていただきます。
          </p>
          <p className="v2-thanks-note">
            ※ iPS作製適合確認を行わせていただく上で、適格でない場合がございます。その際はあらかじめご了承ください。
          </p>

          {/* モバイル時は注意書きと「お問い合わせ」カードの間に画像が入る
              PC時は右カラムに画像が固定配置されるため、ここでは表示しない */}
          <div className="v2-thanks-image-wrap is-mobile-only">
            <Image
              src="/nagashima02.png"
              alt="イメージキャラクター"
              width={360}
              height={480}
              priority
              className="v2-thanks-image"
              unoptimized
            />
          </div>

          <div className="v2-contact-card">
            <div className="v2-contact-card-title">■お問い合わせ</div>
            <p className="v2-contact-card-desc">
              ご不明点などございましたら、以下お問合せフォームよりお気軽にお問合せくださいませ。
            </p>
            <Link href="/form-v2-preview/contact" className="v2-btn-primary v2-contact-card-btn">
              お問い合わせはこちら
            </Link>
          </div>
        </div>

        {/* PC時の右カラム画像 */}
        <div className="v2-thanks-image-wrap is-pc-only">
          <Image
            src="/nagashima02.png"
            alt="イメージキャラクター"
            width={360}
            height={480}
            priority
            className="v2-thanks-image"
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}
