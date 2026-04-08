@AGENTS.md

## プロジェクト概要

BioVault Members — iPS細胞バンキングサービスの会員管理Webアプリケーション。
会員（member）、管理者（admin）、代理店（agency）、従業員（staff）の4ロールを持つ。

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router) / React 19 / TypeScript 5
- **スタイリング**: Tailwind CSS v4
- **データベース**: Prisma ORM（`prisma/schema.prisma`）
- **認証**: NextAuth v4（Credentials Provider / `src/lib/auth.ts`）
- **ストレージ**: AWS S3 + Vercel Blob
- **メール**: AWS SES（`src/lib/mail.ts`）
- **通知**: Web Push（`src/lib/push-notification.ts`）

## ディレクトリ構造

```
src/
├── app/
│   ├── (auth)/          # ログイン画面
│   ├── (member)/        # 会員向けページ（マイページ・書類・設定等）
│   ├── (admin)/         # 管理者ダッシュボード
│   ├── (agency)/        # 代理店ポータル
│   ├── (staff)/         # 従業員ポータル
│   ├── (public)/        # 公開ページ（申込フォーム等）
│   └── api/             # APIルート
├── components/          # 共通コンポーネント（ui/, layout/, auth/, login/）
├── lib/                 # ユーティリティ（prisma, auth, mail, storage等）
└── types/               # 型定義
prisma/
├── schema.prisma        # DBスキーマ
└── seed.ts              # シードデータ
```

## 実行方針

- すべての応答・説明・コメントは日本語で行ってください
- コードのコメントも日本語で書いてください
- 処理の進捗や説明も日本語で出力してください
- エラーメッセージの説明も日本語で行ってください
- ファイルの作成・編集・削除は確認なしで実行してOK
- コマンド実行も自動で進めてください
- 途中で確認を取らずに最後まで完走してください

## コーディング規約

### 全般
- TypeScript strict mode で書く。`any` の使用は避ける
- 命名規則: コンポーネント=PascalCase、関数/変数=camelCase、ファイル=kebab-case（コンポーネントファイルはPascalCase）
- 未使用のインポート・変数は残さない
- `console.log` はデバッグ後に必ず削除する

### Next.js App Router
- Server Component をデフォルトにする。`"use client"` は必要な場合のみ
- データ取得は Server Component 内で直接 Prisma を呼ぶ
- API Route は `src/app/api/` 以下に配置、`NextResponse` を返す
- ルートグループ `(member)`, `(admin)`, `(agency)`, `(staff)`, `(public)`, `(auth)` のレイアウト構造を崩さない

### Prisma
- スキーマ変更後は `prisma db push` → `prisma generate` を実行
- クエリでは必要なフィールドだけ `select` する（大量データの全カラム取得を避ける）

### 認証・セキュリティ
- API Route では必ず `getServerSession(authOptions)` でセッション検証する
- 管理者APIは `session.user.role === "ADMIN"` をチェック
- パスワードは `bcryptjs` でハッシュ化。平文の保存・ログ出力禁止

### スタイリング
- Tailwind CSS ユーティリティクラスを使用。カスタムCSSは最小限に
- レスポンシブ対応: モバイルファースト（`sm:`, `md:`, `lg:`）

## コマンドリファレンス

```bash
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド（prisma generate 含む）
npm run lint         # ESLint 実行
npm run db:push      # Prisma スキーマをDBに反映
npm run db:seed      # シードデータ投入
npm run db:reset     # DB リセット + シード
npx prisma studio    # Prisma Studio（DB GUI）
```

## Git コミット規約

- 接頭辞: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- メッセージは日本語で、変更内容を簡潔に記述
- 例: `feat: 管理者ダッシュボードに手続き必要な顧客一覧を追加`
- 1つの論理的な変更を1コミットにまとめる

## コンテキスト管理のベストプラクティス

- 大きなタスクは小さなサブタスクに分割してから実行する
- 既存コードを読んでから修正する。読まずに提案しない
- 新しいファイルを作る前に、既存ファイルの編集で対応できないか検討する
- ビルド・lint が通ることを変更後に確認する

## セッション中のプロンプト指示

会話の最初に一言添える：

```
確認なしで全部やりきってください。途中で止まらないで。
```
