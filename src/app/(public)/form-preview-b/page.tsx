/**
 * /form-preview-b
 *
 * フォームUIデザイン案B(黒×ゴールドのラグジュアリー)のペラページ。
 *
 * - デザイン比較用の UI モックアップ。送信処理は行いません(ダミー)。
 * - 全項目を1ページに縦並び(ステップ分割なし)。
 * - 専用テーマ form-b-theme.css(.fb-scope)のみを使用し、既存ページ・
 *   共有コンポーネント・API には一切影響しません。
 */

"use client";

import { Fragment } from "react";
import Image from "next/image";
import "@/app/form-b-theme.css";

export default function FormPreviewBPage() {
  return (
    <div className="fb-scope">
      {/* バナー */}
      <header className="fb-banner">
        {/* 背景動画(うっすら) */}
        <video
          className="fb-banner-video"
          src="/header-bg.mp4"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <div className="fb-banner-inner">
          <div className="fb-banner-text">
            <div className="fb-logo">
              <div className="fb-logo-brand">BioVault</div>
              <div className="fb-logo-tagline">Membership Service</div>
            </div>
            <h1 className="fb-banner-title">
              iPS細胞作製
              <br />
              適合確認申請
            </h1>
            <span className="fb-banner-line" />
          </div>
          <div className="fb-banner-image">
            <Image
              src="/nagashima01black.png"
              alt="イメージキャラクター"
              width={290}
              height={360}
              priority
              unoptimized
            />
          </div>
        </div>
      </header>

      <main className="fb-main">
        <div className="fb-container">
          <p className="fb-intro">
            本申請はBioVaultメンバーシップ内で提供するiPSサービス契約の確約ではなく、ご利用検討者様のiPS細胞の作製適合確認、ならびにBioVaultメンバーサイトへのアクセス権を提供するための手続きとなります。
          </p>

          {/* ステップインジケーター(装飾) */}
          <div className="fb-steps">
            {[1, 2, 3, 4].map((n, i) => (
              <Fragment key={n}>
                <div className={`fb-step-dot${n === 1 ? " is-active" : ""}`}>{n}</div>
                {i < 3 && <div className="fb-step-line" />}
              </Fragment>
            ))}
          </div>

          <div className="fb-card">
            {/* 申請者情報 */}
            <h2 className="fb-section-title">申請者情報</h2>

            <div className="fb-field">
              <label className="fb-label">
                氏名<span className="fb-req">*</span>
              </label>
              <input className="fb-input" placeholder="山田 太郎" />
              <div className="fb-help">
                ※ 姓と名の間にスペースを入れてください(例: 山田 太郎)
              </div>
            </div>

            <div className="fb-field">
              <label className="fb-label">
                フリガナ(カタカナ)<span className="fb-req">*</span>
              </label>
              <input className="fb-input" placeholder="ヤマダ タロウ" />
              <div className="fb-help">
                ひらがなで入力すると自動でカタカナに変換されます
              </div>
            </div>

            <div className="fb-field">
              <label className="fb-label">
                生年月日<span className="fb-req">*</span>
              </label>
              <div className="fb-date-row">
                <select className="fb-select" defaultValue="1980">
                  {Array.from({ length: 81 }, (_, i) => 1930 + i).map((y) => (
                    <option key={y} value={y}>
                      {y}年
                    </option>
                  ))}
                </select>
                <select className="fb-select" defaultValue="1">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m}月
                    </option>
                  ))}
                </select>
                <select className="fb-select" defaultValue="1">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {d}日
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="fb-field">
              <label className="fb-label">郵便番号</label>
              <input className="fb-input" placeholder="000-0000" inputMode="numeric" />
            </div>

            <div className="fb-field">
              <label className="fb-label">
                住所<span className="fb-req">*</span>
              </label>
              <input className="fb-input" placeholder="東京都港区..." />
            </div>

            <div className="fb-field">
              <label className="fb-label">
                電話番号(ハイフンなし)<span className="fb-req">*</span>
              </label>
              <input
                className="fb-input"
                type="tel"
                inputMode="numeric"
                placeholder="09012345678"
              />
            </div>

            <div className="fb-field">
              <label className="fb-label">
                メールアドレス<span className="fb-req">*</span>
              </label>
              <input className="fb-input" type="email" placeholder="your@email.com" />
            </div>

            <div className="fb-field">
              <label className="fb-label">職業</label>
              <select className="fb-select" defaultValue="">
                <option value="">選択してください</option>
                <optgroup label="経営・役員">
                  <option value="会社経営者">会社経営者</option>
                  <option value="会社役員">会社役員</option>
                </optgroup>
                <optgroup label="会社員・団体職員">
                  <option value="会社員(管理職)">会社員(管理職)</option>
                  <option value="会社員(一般)">会社員(一般)</option>
                  <option value="団体職員">団体職員</option>
                  <option value="公務員">公務員</option>
                </optgroup>
                <optgroup label="専門職">
                  <option value="医師">医師</option>
                  <option value="歯科医師">歯科医師</option>
                  <option value="薬剤師">薬剤師</option>
                  <option value="看護師">看護師</option>
                  <option value="弁護士">弁護士</option>
                  <option value="公認会計士・税理士">公認会計士・税理士</option>
                  <option value="建築士">建築士</option>
                  <option value="その他士業">その他士業</option>
                </optgroup>
                <optgroup label="自営・フリーランス">
                  <option value="自営業">自営業</option>
                  <option value="フリーランス">フリーランス</option>
                  <option value="農林水産業">農林水産業</option>
                </optgroup>
                <optgroup label="その他">
                  <option value="不動産オーナー">不動産オーナー</option>
                  <option value="投資家">投資家</option>
                  <option value="年金生活者">年金生活者</option>
                  <option value="主婦・主夫">主婦・主夫</option>
                  <option value="学生">学生</option>
                  <option value="無職">無職</option>
                  <option value="その他">その他</option>
                </optgroup>
              </select>
            </div>

            {/* 同意 */}
            <h2 className="fb-section-title">申請情報取扱いに関する同意</h2>
            <div className="fb-notice">
              本申請書に記載した内容は、メンバーシップ契約手続き、提携医療機関等による問診・適格確認、細胞作製・保管に関する各種手続きの参考資料として利用されます。
            </div>
            <label className="fb-check-row">
              <input type="checkbox" />
              <span className="fb-check-label">上記の内容を理解し、承諾します</span>
            </label>

            <button
              type="button"
              className="fb-btn"
              onClick={() => alert("デザインプレビュー(案B)のため送信は行いません")}
            >
              申請する
            </button>
          </div>
        </div>
      </main>

      <footer className="fb-footer">© 2025 SCPP Inc. All Rights Reserved.</footer>
    </div>
  );
}
