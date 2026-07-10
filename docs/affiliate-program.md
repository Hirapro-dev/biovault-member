# 紹介協力制度（アフィリエイト）設計書

最終更新: 2026-07-09 / ステータス: Phase 1+2 実装済み（design-renewal-preview ブランチ）

> 実装時の変更点:
> - 人脈繋がりチャネルのURLは `/partner/register/nw`（旧案: jinmyaku）。enum も `NW`
> - LPは静的HTML移植（public/lp/ipsf/ + next.config.ts の rewrite）。GAタグ(G-VVH225G59Q)組込済み
> - 適合確認フォームは 氏名・電話 に加え、会員登録に必須の フリガナ・生年月日 も取得（既存applyの必須項目のため）
> - 第二報酬の起票タイミングは 管理者の「ID発行（issue-id）」時（=IDパス発行）
> - 報酬ステータスは既存 CommissionStatus を流用: PENDING(承認待ち)→CONFIRMED(承認)→PAID(支払済) / CANCELLED(却下)
> - 協力者ポータルはPhase 1に前倒しで実装（口座はポータルから登録）

## 概要

代理店とは別の「紹介協力制度」。紹介協力者（アフィリエイター）が専用URLでLPを紹介し、
リード獲得（第一報酬）と本登録（第二報酬）の二段階で報酬が発生するASP型の仕組み。

- LPは同一ドメイン（`member.biovault.jp/lp/ipsf/`）に移植して運用（契約主体・商標は確認済み、scheme=MRT固定）
- 報酬の確定はすべて管理側の承認制（自動確定なし）
- 流入チャネルは「人脈繋がり」「KAWARA版」の2系統

## 全体フロー

| # | 誰が | 何をする | システム上の動き |
|---|---|---|---|
| ① | 紹介協力者 | 登録フォームから自己登録（チャネル別に2フォーム） | `AffiliateProfile` 作成。承認モードに応じて即有効 or 承認待ち |
| ② | 紹介協力者 | 専用ページで自分のLP URLを取得し紹介 | `…/lp/ipsf/?ref=AF-0001` |
| ③ | 顧客 | LP上のリードフォームから登録（名前・メール・住所・電話・職業・役職・年収） | `AffiliateLead` 作成 + 第一報酬を PENDING で起票（重複時は起票しない） |
| ④ | 営業スタッフ | リード一覧に架電、結果を記録。「繋がった」にすると適合確認フォームの専用URLを顧客へ自動メール送信 | 架電ステータス更新・`formSentAt` 記録 |
| ⑤ | 顧客 | 専用URLから適合確認フォーム入力（名前・電話番号 + 健康状態確認以降のみ。③の取得済み項目は再取得しない） | トークンでリードと自動紐付け → `Application` 作成（scheme=MRT） |
| ⑥ | 管理側 | 適合確認 → 問題なければ本登録（ID・パス発行） | 第二報酬を PENDING で起票 |
| ⑦ | 管理者 | 第一・第二報酬を承認 | 確定時に協力者へメール通知 + 協力者ページに反映 |

## 確定した仕様（ヒアリング結果）

| 項目 | 決定内容 |
|---|---|
| 報酬体系 | 固定額。**チャネル別デフォルト + 協力者ごと個別上書き**の両方を設定可能 |
| 第一報酬の承認基準 | 架電が繋がったリードのみ管理者が承認 |
| 協力者の登録承認 | 管理画面のトグルで「自動有効化 / 手動承認制」を切替可能 |
| 協力者登録フォーム | チャネル別に2 URL（人脈用・KAWARA版用） |
| 顧客向けLP | 1つ。チャネルは `ref` コード（協力者の所属チャネル）から自動判別 |
| 適合確認フォームへの誘導 | リードごとの専用URL（トークン付き）を発行し、架電「繋がった」記録時に自動メール送信。再送も可能 |
| リード一覧の閲覧場所 | admin と staff の両方に「紹介協力」メニューを新設。全員が同じリストを見る |
| 重複リード | 同一電話番号 or メールの2件目以降は報酬対象外（リードは記録するが報酬は起票しない） |
| 報酬確定通知 | メール送付 + 協力者用ページで確認可能 |
| 代理店との競合 | 両方該当した場合は両方 PENDING で起票し、管理者が判断して片方を却下 |
| Cookie有効期間 | 30日（`bv_aff`、ファーストパーティ） |

## DB設計

### 新規モデル

```prisma
enum AffiliateChannel {
  NW       // 人脈繋がり（ネットワーク）
  KAWARA     // KAWARA版
}

enum AffiliateStatus {
  PENDING    // 承認待ち（手動承認モード時）
  ACTIVE     // 有効
  SUSPENDED  // 停止
}

enum LeadCallStatus {
  UNCALLED   // 未架電
  CONNECTED  // 繋がった（→適合確認フォーム自動送信）
  NO_ANSWER  // 不通
  RECALL     // 再架電予定
  INVALID    // 無効（連絡先誤り等）
}

enum AffiliateRewardType {
  LEAD        // 第一報酬（リード獲得）
  CONVERSION  // 第二報酬（本登録）
}

model AffiliateProfile {
  id                     String            @id @default(cuid())
  userId                 String            @unique
  user                   User              @relation(fields: [userId], references: [id])
  affiliateCode          String            @unique   // AF-0001形式
  channel                AffiliateChannel
  status                 AffiliateStatus   @default(PENDING)
  displayName            String?                     // 活動名（SNS名等）
  rewardAmountLead       Int?                        // 個別上書き。null=チャネル既定を適用
  rewardAmountConversion Int?                        // 同上
  bankName               String?
  bankBranch             String?
  bankAccountType        String?
  bankAccountNumber      String?
  bankAccountName        String?
  hasAgreedTerms         Boolean           @default(false)
  agreedAt               DateTime?
  scheme                 Scheme            @default(MRT)
  leads                  AffiliateLead[]
  rewards                AffiliateReward[]
  clicks                 AffiliateClick[]
  createdAt              DateTime          @default(now())
  updatedAt              DateTime          @updatedAt
}

model AffiliateClick {
  id                 String           @id @default(cuid())
  affiliateProfileId String
  affiliateProfile   AffiliateProfile @relation(fields: [affiliateProfileId], references: [id])
  clickedAt          DateTime         @default(now())
  userAgent          String?
  referer            String?
  ipHash             String?          // 生IPは保存しない
}

model AffiliateLead {
  id                 String           @id @default(cuid())
  affiliateProfileId String
  affiliateProfile   AffiliateProfile @relation(fields: [affiliateProfileId], references: [id])
  // ③で取得する項目
  name               String
  email              String
  address            String
  phone              String
  occupation         String?
  position           String?          // 役職
  income             String?          // 年収（選択式想定）
  // 架電管理
  callStatus         LeadCallStatus   @default(UNCALLED)
  callNote           String?
  calledAt           DateTime?
  staffCode          String?          // 対応した営業スタッフ
  // 適合確認フォーム連携
  formToken          String           @unique @default(cuid())  // 専用URL用
  formSentAt         DateTime?                                  // 最終送信日時
  applicationId      String?          @unique                   // 提出後に紐付け
  // 重複管理
  isDuplicate        Boolean          @default(false)  // 同一電話/メールの2件目以降
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt
}

model AffiliateReward {
  id                 String              @id @default(cuid())
  affiliateProfileId String
  affiliateProfile   AffiliateProfile    @relation(fields: [affiliateProfileId], references: [id])
  rewardType         AffiliateRewardType
  leadId             String?                       // 第一報酬の対象リード
  memberUserId       String?                       // 第二報酬の対象会員
  memberName         String?
  memberNumber       String?
  rewardAmount       Int                           // 起票時点の適用額を確定保存
  status             CommissionStatus    @default(PENDING)  // 既存enum流用
  paidAt             DateTime?
  note               String?
  createdAt          DateTime            @default(now())

  @@unique([affiliateProfileId, rewardType, leadId])       // 第一報酬の重複防止
  @@unique([affiliateProfileId, rewardType, memberUserId]) // 第二報酬の重複防止
}
```

### 既存モデルへの追加

| 対象 | 追加 |
|---|---|
| `enum Role` | `AFFILIATE` |
| `Application` | `referredByAffiliate String?` / `affiliateLeadId String?` |
| `User` | `referredByAffiliate String?` / `affiliateProfile AffiliateProfile?` |

### 設定（SiteSetting のkey-value流用）

| key | 内容 |
|---|---|
| `affiliate_auto_approve` | `"true"` / `"false"` — 協力者登録の自動有効化トグル |
| `affiliate_reward_lead_nw` | 人脈: 第一報酬デフォルト額 |
| `affiliate_reward_lead_kawara` | KAWARA版: 第一報酬デフォルト額 |
| `affiliate_reward_conversion_nw` | 人脈: 第二報酬デフォルト額 |
| `affiliate_reward_conversion_kawara` | KAWARA版: 第二報酬デフォルト額 |

報酬額の適用順: 協力者個別設定（`rewardAmount*`） → なければチャネル別デフォルト。
起票時点の金額を `AffiliateReward.rewardAmount` に確定保存（後から設定を変えても過去の報酬は変わらない）。

## 画面構成

### 公開（`(public)`）

| パス | 内容 |
|---|---|
| `/lp/ipsf/` | 移植したLP + リードフォーム（`?ref=AF-xxxx` でクリック記録・Cookie発行・帰属） |
| `/partner/register/nw` | 協力者登録フォーム（人脈繋がり） |
| `/partner/register/kawara` | 協力者登録フォーム（KAWARA版） |
| `/form/ips-check/[token]` | 適合確認フォーム短縮版（名前・電話 + 健康状態確認以降。トークンでリード特定） |

### 管理者（`(admin)` — サイドバーに「紹介協力」メニュー追加）

| 画面 | 内容 |
|---|---|
| 協力者一覧 | コード / 名前 / チャネル / ステータス / クリック / リード / 成約 / 報酬累計。承認・停止操作 |
| 協力者詳細 | 専用URL、個別報酬額設定、口座情報、リード・報酬履歴 |
| リード一覧 | 全リード（staffと同一リスト）。架電記録・フォーム送信/再送・重複フラグ表示 |
| 報酬管理 | 第一/第二・ステータス絞込、承認（→メール通知）、支払済マーク |
| 設定 | 自動承認トグル、チャネル別デフォルト報酬額 |

### 営業スタッフ（`(staff)` — メニュー追加）

| 画面 | 内容 |
|---|---|
| リード一覧 | adminと同じリスト。架電結果記録（「繋がった」で適合確認フォーム自動メール送信） |

### 紹介協力者（新ルートグループ `(affiliate)` — agencyポータルと同型）

| 画面 | 内容 |
|---|---|
| ダッシュボード | 専用URLコピー、今月のクリック / リード / 成約 / 報酬、月次推移 |
| 報酬履歴 | 第一/第二・発生日・金額・ステータス |
| 設定 | 口座情報、パスワード変更 |

## API設計（すべて認証・ロール検査は既存規約どおり）

```
# 公開（レート制限・入力検証を厳格に）
POST /api/lp/click                       … クリック記録
POST /api/lp/lead                        … リード登録（重複判定 + 第一報酬起票）
POST /api/partner/register               … 協力者登録（channel付き）
GET  /api/form/ips-check/[token]         … リード情報取得（表示名等の最小限）
POST /api/form/ips-check/[token]         … 適合確認フォーム提出 → Application作成

# admin
GET/POST   /api/admin/affiliates             … 一覧・登録
GET/PATCH  /api/admin/affiliates/[id]        … 詳細・更新（承認/停止/報酬額）
GET        /api/admin/affiliate-leads        … リード一覧
PATCH      /api/admin/affiliate-leads/[id]   … 架電記録・フォーム再送
GET/PATCH  /api/admin/affiliate-rewards      … 報酬一覧・承認・支払
GET/PATCH  /api/admin/affiliate-settings     … トグル・デフォルト報酬額

# staff（リード操作のみ）
GET        /api/staff/affiliate-leads
PATCH      /api/staff/affiliate-leads/[id]

# affiliate本人
GET        /api/affiliate/dashboard
GET        /api/affiliate/rewards
PATCH      /api/affiliate/bank-account
```

## メール（SES / `src/lib/mail.ts` に追加）

| テンプレート | 送信タイミング | 宛先 |
|---|---|---|
| 協力者登録受付 | セルフ登録直後（承認待ちの場合） | 協力者 |
| 協力者アカウント発行 | 有効化時（ログイン情報。既存 `agencyAccountCreatedEmail` と同型） | 協力者 |
| 適合確認フォーム案内 | 架電「繋がった」記録時に自動送信（専用URL付き）・再送可 | リード顧客 |
| 第一報酬確定通知 | 管理者承認時 | 協力者 |
| 第二報酬確定通知 | 管理者承認時 | 協力者 |
| 新規リード通知 | リード登録時 | 管理者（運用に応じて） |

## 報酬起票・確定ロジック

1. **第一報酬**: `POST /api/lp/lead` 成功時、重複でなければ PENDING で自動起票。金額は「個別設定→チャネル既定」の順で解決し確定保存
2. **第二報酬**: 既存の本登録API（`applications/[id]/register`）拡張。`Application.affiliateLeadId` があれば PENDING で自動起票
3. **承認**: 管理者が報酬管理画面で APPROVED に変更 → 協力者へメール通知。却下も可能
4. **支払**: 振込後に PAID + `paidAt` 記録
5. **代理店競合**: 代理店コードとアフィリエイトの両方が付いた場合、代理店報酬・アフィリエイト報酬の両方を PENDING で起票し管理者が判断

## セキュリティ・不正対策

- 公開API（lead / click / partner register）はレート制限 + honeypot等のbot対策
- `formToken` は推測不能なcuid。提出済みトークンは再利用不可
- リードのIPはハッシュのみ保存（個人情報保護）
- 自己申込疑い（協力者本人とリードのメール・電話一致）は管理画面で警告表示
- 協力者の `SUSPENDED` で帰属・起票を即停止

## 実装フェーズ

| Phase | 内容 |
|---|---|
| **1** | DB追加 / LP移植+リードフォーム / 協力者登録フォーム×2 / トラッキング / 適合確認フォーム（トークン式） / admin・staffのリード管理 / 報酬起票・承認 / メール一式 |
| **2** | 協力者ポータル（ダッシュボード・報酬履歴・設定） |
| **3** | 分析強化（CSV出力・チャネル別レポート）、不正検知（同一IP大量クリック等） |

## 未決事項

- 【要確認】年収（`income`）の選択肢（選択式にする場合のレンジ）
- 【要確認】LPの現行デザイン素材（HTML/画像）の入手方法
- 【要確認】協力者登録フォームの取得項目の確定（氏名・メール・電話・活動名・口座は登録時 or 後から?）
- 【要確認】適合確認フォーム案内メールの文面（法的文言の要否）
