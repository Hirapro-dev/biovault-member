@AGENTS.md

## このファイルの位置づけ

このCLAUDE.mdは **プロジェクトの永続メモリ** として機能します。
Claude Codeが毎セッションの冒頭で参照する「共有知識ベース」として、以下を集約します：

- プロジェクトの核となる価値観と設計原則
- 反復可能なパターンとルール
- チーム作業スタイルの定義
- ドメイン固有の制約（医療系・個人情報）

参考: [claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice)

---

## プロジェクト概要

BioVault Members — iPS細胞バンキングサービスの会員管理Webアプリケーション。
会員（member）、管理者（admin）、代理店（agency）、従業員（staff）の4ロールを持つ。

### ドメインの特性（重要）

- **医療系サービス**: 個人情報・同意書・契約書を扱う。情報漏洩と誤送信は致命的
- **法的拘束力のある書類**: 重要事項説明書・個人情報取扱同意書・細胞提供保管同意書など
- **監査要件**: 同意取得・操作履歴は後から追跡可能であるべき

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

---

## 標準ワークフロー: Research → Plan → Execute → Review → Ship

すべてのタスクはこの5段階で進めます（軽微な修正は Research→Execute→Review に短縮可）。

### 1. Research（調査）
- 既存コード・スキーマ・ルートを読んでから着手する。**読まずに提案しない**
- 類似機能が既にないか `Grep` / `Glob` で必ず確認する
- 大規模な調査は `Task` ツール（Explore agent）に委譲してコンテキストを節約する

### 2. Plan（計画）
- 3ステップ以上かかるタスクは `TodoWrite` でToDoを先に立てる
- 影響範囲（ロール・DBスキーマ・API・UI）を列挙してから手を付ける
- スキーマ変更・破壊的変更を含む場合は先にユーザーへ要点を共有する

### 3. Execute（実装）
- **既存ファイルの編集を優先**。新規ファイル作成は既存で対応できない場合のみ
- 1論理変更=1コミット相当の粒度で進める
- 独立したファイル読み取り・検索は並列ツール呼び出しで実行する

### 4. Review（検証）
変更後は以下を必ず確認（該当するもののみ）：
- `npm run lint` — ESLintエラーゼロ
- `npm run build` — ビルド通過（prisma generateを含む）
- 型エラーゼロ（tsc）
- 認証・ロールチェックが必要なAPIに漏れがないか
- `console.log` / 未使用import / 未使用変数が残っていないか

### 5. Ship（反映）
- ユーザーが明示的にコミット/プッシュを指示するまで**自動でcommit/pushしない**
- コミットメッセージは日本語、接頭辞付き（下記「Git コミット規約」参照）

---

## 実行方針

- **言語**: すべての応答・説明・コメント・進捗・エラー説明は **日本語**
- **自走**: ファイル作成・編集・削除・コマンド実行は確認なしで進めてOK。途中で止まらずタスクを完走する
- **ただし例外**:
  - DB破壊的変更（`db:reset`、カラム削除、データ削除）は事前確認
  - 本番環境への影響（デプロイ・env変更）は事前確認
  - git push / PR作成 / force push は明示指示がある場合のみ
- **セッション冒頭の一言**: `確認なしで全部やりきってください。途中で止まらないで。`

---

## コーディング規約

### 全般
- TypeScript strict mode で書く。`any` の使用は避ける（やむを得ない場合は理由をコメント）
- 命名規則: コンポーネント=PascalCase、関数/変数=camelCase、ファイル=kebab-case（コンポーネントファイルはPascalCase）
- 未使用のインポート・変数は残さない
- `console.log` はデバッグ後に必ず削除する
- **過剰設計の禁止**: 依頼されていない機能追加・リファクタ・将来のための抽象化は行わない

### Next.js App Router（Next.js 16）
- Server Component をデフォルト。`"use client"` は必要な場合のみ
- データ取得は Server Component 内で直接 Prisma を呼ぶ
- API Route は `src/app/api/` 以下に配置し、`NextResponse` を返す
- ルートグループ `(auth)`, `(member)`, `(admin)`, `(agency)`, `(staff)`, `(public)` のレイアウト構造を崩さない
- **Next.js 16 は破壊的変更あり**。書く前に `node_modules/next/dist/docs/` の該当ガイドを確認する（AGENTS.md参照）

### Prisma
- スキーマ変更後は `prisma db push` → `prisma generate` を実行
- クエリでは必要なフィールドだけ `select` する（大量データの全カラム取得を避ける）
- N+1を避ける。関連は `include` でまとめて取得する

### 認証・セキュリティ（医療系なので厳格に）
- API Route では必ず `getServerSession(authOptions)` でセッション検証する
- ロール別APIは `session.user.role` を検査（ADMIN/AGENCY/STAFF/MEMBER）
- 他人のデータにアクセスするAPIは**必ず所有者チェック**（`userId` 一致確認）
- パスワードは `bcryptjs` でハッシュ化。平文の保存・ログ出力禁止
- 個人情報・同意書・契約書のログ出力禁止（デバッグ時も）
- メール・プッシュ通知の送信先はサーバー側で検証（クライアントから宛先を受け取らない）

### スタイリング
- Tailwind CSS ユーティリティクラスを使用。カスタムCSSは最小限に
- レスポンシブ対応: モバイルファースト（`sm:`, `md:`, `lg:`）
- 絵文字は明示指示がない限り追加しない

---

## コンテキスト管理のベストプラクティス

- **大きなタスクは小さなサブタスクに分割**してから実行する
- **既存コードを読んでから修正**する。読まずに提案しない
- **新しいファイルを作る前に**、既存ファイルの編集で対応できないか検討する
- **並列読み取り**: 独立した読み取り・検索は1メッセージで並列実行してコンテキストを節約
- **Explore agentの活用**: 広範な探索や「どこで実装されているか分からない」調査は `Task(subagent_type=Explore)` に委譲
- **ビルド・lint が通ること**を変更後に確認する
- **長期記憶**: 同じミスを繰り返さないよう、判明した制約・罠は本ファイルに追記する

---

## コマンドリファレンス

```bash
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド（prisma generate 含む）
npm run lint         # ESLint 実行
npm run db:push      # Prisma スキーマをDBに反映
npm run db:seed      # シードデータ投入
npm run db:reset     # DB リセット + シード（破壊的・要確認）
npx prisma studio    # Prisma Studio（DB GUI）
```

---

## Git コミット規約

- 接頭辞: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- メッセージは**日本語**で、変更内容を簡潔に記述
- 例: `feat: 管理者ダッシュボードに手続き必要な顧客一覧を追加`
- 1つの論理的な変更を1コミットにまとめる
- **コミットはユーザーが明示的に指示した時のみ実行する**
- `--no-verify` / `--amend` / `push --force` は明示指示がある場合のみ

---

## やってはいけないこと（ガードレール）

- 個人情報・パスワード・トークンをログ出力する
- 認証チェックを省いたAPIを作る
- `db:reset` を確認なしで実行する
- 本番環境変数を勝手に変更する
- 既存の同意書・契約書・法的文書の文言を勝手に改変する（文言変更は必ず確認）
- 依頼されていないリファクタ・整形・抽象化を広範囲に行う
- `console.log` を残したままコミットする
- ルートグループのレイアウト構造を勝手に変更する
