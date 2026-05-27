# デザイン刷新(v2)ガイド

## 概要

本ドキュメントは、BioVault Members の **iPS細胞作製の適合確認申込フォーム** を中心としたデザイン刷新の進め方をまとめたものです。

- **方針**: 本番(main)に一切影響を与えず、新デザインを段階的に検証・反映
- **対象ブランチ**: `design-renewal`
- **対象URL(プレビュー)**: `/form-v2-preview`
- **コンセプト**: 黒×ゴールド(高級感)→ 白ベース+ゴールド差し色(カジュアル+快活)
- **キービジュアル**: 長嶋一茂氏(`public/v2/nagashima01.png`)

---

## 本番完全分離の構造

このリニューアルでは、**既存ファイルを一切変更していません**。新規ファイルのみを追加することで、本番(`main`)コードへの副作用ゼロを実現しています。

### 追加されたファイル

| パス | 役割 |
|---|---|
| `public/v2/nagashima01.png` | 新デザイン用キービジュアル(本番直下とは別ディレクトリ) |
| `src/app/v2-theme.css` | v2専用テーマCSS(`.v2-scope` 配下のみに適用) |
| `src/components/form-v2/V2Wrapper.tsx` | v2ページラッパー(ヘッダー含む) |
| `src/components/form-v2/HeroSection.tsx` | ヒーローセクション(画像+タイトル) |
| `src/components/form-v2/V2Button.tsx` | v2用ボタン |
| `src/app/(public)/form-v2-preview/page.tsx` | 静的プレビューページ(送信機能なし) |
| `docs/design-renewal.md` | 本ドキュメント |

### 変更されていないファイル

- `src/app/globals.css` (既存テーマは無傷)
- `src/app/(public)/form/app/page.tsx` (本番フォームは無傷)
- 他全ての本番ファイル

---

## デザイントークン(v2-theme.css)

すべての色・余白は CSS 変数として `.v2-scope` 配下にスコープされています。

### 主要カラーパレット

| トークン | 値 | 用途 |
|---|---|---|
| `--v2-bg-base` | `#FFFFFF` | メイン背景 |
| `--v2-bg-soft` | `#FAF8F4` | セクション背景(ウォーム) |
| `--v2-bg-elevated` | `#F5F0E6` | 強調エリア(ベージュ寄り) |
| `--v2-bg-dark` | `#0A0A0A` | ヘッダー黒帯(既存トーン継承) |
| `--v2-gold` | `#C9A961` | メインゴールド |
| `--v2-gold-light` | `#E0C786` | ライトゴールド |
| `--v2-gold-dark` | `#A88840` | ボタンホバー等 |
| `--v2-text-primary` | `#1A1A1A` | 本文 |
| `--v2-text-secondary` | `#4A4A4A` | セカンダリ |
| `--v2-required` | `#E53E3E` | 必須マーク |
| `--v2-accent-warm` | `#F5EFE6` | 画像背景の溶け込み用 |
| `--v2-accent-fresh` | `#4AA1A8` | 差し色(ターコイズ) |

### 配色の意図

- **白基調**: 「カジュアル・快活」を実現する最重要要素。黒背景の高級感とは反対の明るさで親しみやすさを演出
- **ゴールド継承**: 既存ブランド資産であるゴールドは引き継ぎ、ただし白背景に乗せることで重厚感→上品なアクセントに転換
- **ベージュ系ウォームトーン**: 長嶋一茂氏のジャケット(ベージュ)と画像背景が自然に溶け込むよう、`--v2-accent-warm` をヒーロー画像の背景に使用

---

## 確認手順(Vercel Preview)

### 1. ローカル確認

```bash
git checkout design-renewal
npm run dev
# ブラウザで http://localhost:3000/form-v2-preview を開く
```

### 2. Vercel Preview URLでの実機確認

```bash
git push origin design-renewal
# → Vercelが自動でPreview URLを発行
# 例: https://biovault-members-git-design-renewal-xxx.vercel.app/form-v2-preview
```

このURLをスマホで開いて実機確認できます。

### 3. Neon DBブランチの確認(任意)

Vercel + Neon Integration を有効化していれば、Preview デプロイごとに DB ブランチが自動作成されます。**プレビューページ自体はDBに書き込みを行わない静的ページ**なので、本番DBへの影響はゼロです。

---

## 本番反映のフロー(段階的)

新デザインの承認が取れた後、本番(main)に反映する手順です。

### Phase 1: プレビューURLでの関係者承認

- 上記Vercel Preview URLを関係者に共有
- スマホ実機 + PC両方で確認
- 配色・レイアウト・画像の溶け込みをチェック
- フィードバックを `design-renewal` ブランチで反映

### Phase 2: 本番フォームへの組み込み(手動)

既存 `src/app/(public)/form/app/page.tsx` への適用は、以下のいずれかの方針で実施してください。

#### 方針A: 新ルートとして並走(推奨)

1. `src/app/(public)/form/app/page.tsx` を手元で `src/app/(public)/form/v2/app/page.tsx` にコピー
2. コピー先のJSX冒頭を `<V2Wrapper>` でラップ
3. 既存の `PageWrapper` を `<HeroSection>` + `v2-section` に置き換え
4. ボタンを `<V2Button>` に差し替え
5. 既存テーマクラス(`bg-bg-primary`, `text-gold` 等)を `v2-*` クラスに置換
6. `/form/v2/app` で動作確認 → 旧URLは温存
7. 切替時は Vercel rewrites または手動リネームで本番化

#### 方針B: 既存ファイルを直接書き換え

- `git checkout design-renewal` のまま既存 `page.tsx` を編集
- `<PageWrapper>` を `<V2Wrapper>` + ヒーロー追加
- 同上のクラス置換を実施
- 旧デザインへのロールバックは `git revert` で対応

#### 方針C: feature flag で切替

- 環境変数 `NEXT_PUBLIC_DESIGN_THEME=renewal` でテーマ切替
- 本番反映後でも環境変数で旧デザインに即時ロールバック可能

---

## クラス対応表(既存 → v2)

本番フォームへの組み込み時に参考にしてください。

| 既存(Tailwind) | v2(プレーンCSS) |
|---|---|
| `bg-bg-primary` | `bg-base`(scope内自動) |
| `bg-bg-secondary` | `v2-section`(枠付き) |
| `bg-bg-elevated` | `v2-bg-elevated` 相当 |
| `text-text-primary` | `v2-text-primary`(scope内自動) |
| `text-gold` | (使用箇所による:見出しは黒、アクセントのみゴールド) |
| `border-border` | `v2-border` |
| `border-border-gold` | `v2-gold-border` |
| `bg-gold-gradient` | `v2-btn-primary` |
| `font-serif-jp` | `v2-section-title` `v2-hero-title` 内で適用済み |
| `text-status-danger` | `v2-required-mark` 又は `v2-error` |

---

## 既知の制約・注意事項

### 1. v2スタイルはスコープ必須

すべての v2 スタイルは `.v2-scope` 配下でのみ有効です。`<V2Wrapper>` を使えば自動で付与されます。

### 2. 画像最適化

ヒーロー画像は `next/image` で読み込みますが、`unoptimized` 属性を付けています。これは Vercel の画像最適化が静的アセットでブロックされる場合に備えた措置です。本番反映時、必要に応じて `unoptimized` を外してください。

### 3. プレビューページは SEO 除外

`/form-v2-preview` ページは `robots: { index: false, follow: false }` を設定しており、検索エンジンに登録されません。Preview URL を共有しても安心です。

### 4. フォントサイズの底上げ

既存 `globals.css` には `.text-xs` 等のサイズ底上げ ルールがあります(`!important` 付き)。`.v2-scope` 配下では Tailwind ユーティリティを極力使わず、生CSSのクラスで完結させているため、これらの底上げの影響を受けません。

---

## ロールバック

### Preview URL は不要になった場合

```bash
# プレビューページだけ削除する場合
rm src/app/(public)/form-v2-preview/page.tsx
git commit -am "chore: v2プレビューページを削除"
```

### v2 全体をなかったことにする場合

```bash
git checkout main  # 本番に戻る
git branch -D design-renewal  # ローカルブランチ削除
git push origin --delete design-renewal  # リモートブランチ削除
```

`main` は一切汚れていないため、即時に元の状態に戻せます。

---

## 次のステップ

- [ ] Vercel Preview URL を取得し、スマホ実機で確認
- [ ] 関係者(社内・株主・長嶋一茂氏側)に Preview URL を共有して承認取得
- [ ] フィードバックを `design-renewal` ブランチで反映
- [ ] 承認後、上記「本番反映のフロー」に従って組み込み
- [ ] 他フォーム(MRT流入 `/m/form/app` 等)への横展開を検討
