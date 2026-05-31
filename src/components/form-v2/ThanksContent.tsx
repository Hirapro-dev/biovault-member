/**
 * ThanksContent
 *
 * デザイン刷新版(v2)の申請完了サンクス画面のコンテンツ部分。
 *
 * 見出しはバナー(header)側に移動し(V2Wrapper の title)、本文はフォームページと
 * 同様にバナー直下へ連結する白カード(.v2-section.v2-card-connected)内へ収める。
 *
 * レスポンシブ挙動:
 *  - PC(>=768px): 左テキスト + 右画像(nagashima02)の2カラム
 *  - モバイル(<768px): 縦積み(説明 → 注意 → 画像 → お問い合わせカード)
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
      {/* 見出しはバナー(header)側に移動。本文はカード化せず地に直接置き、
          「お問い合わせ」部分のみカード(グラデ)にする */}
      <div className="v2-thanks-grid">
        <div className="v2-thanks-text">
          <p className="v2-thanks-desc">
            ご申請いただいた内容をもとに、本部にてiPS細胞作製適合確認を行います。
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
            <Link
              href="/form-v2-preview/contact"
              className="v2-btn-primary v2-contact-card-btn"
            >
              お問い合わせはこちら
            </Link>
          </div>
        </div>

        {/* PC時の右カラム画像(配置は従来どおり) */}
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
