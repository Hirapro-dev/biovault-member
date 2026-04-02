-- BioVault IpsStatus マイグレーション
-- 旧enum値 → 新enum値へのデータマッピング
-- ※ prisma db push 実行後に必要に応じて実行

-- 1. 既存データのマッピング（Membershipテーブル）
UPDATE "Membership" SET "ipsStatus" = 'REGISTERED' WHERE "ipsStatus" = 'APPLICATION';
UPDATE "Membership" SET "ipsStatus" = 'SERVICE_APPLIED' WHERE "ipsStatus" = 'CONTRACT_SIGNED';
UPDATE "Membership" SET "ipsStatus" = 'SCHEDULE_ARRANGED' WHERE "ipsStatus" = 'CLINIC_RESERVED';
UPDATE "Membership" SET "ipsStatus" = 'STORAGE_ACTIVE' WHERE "ipsStatus" = 'IPS_COMPLETED';

-- 2. 既存データのマッピング（StatusHistoryテーブル - fromStatus）
UPDATE "StatusHistory" SET "fromStatus" = 'REGISTERED' WHERE "fromStatus" = 'APPLICATION';
UPDATE "StatusHistory" SET "fromStatus" = 'SERVICE_APPLIED' WHERE "fromStatus" = 'CONTRACT_SIGNED';
UPDATE "StatusHistory" SET "fromStatus" = 'SCHEDULE_ARRANGED' WHERE "fromStatus" = 'CLINIC_RESERVED';
UPDATE "StatusHistory" SET "fromStatus" = 'STORAGE_ACTIVE' WHERE "fromStatus" = 'IPS_COMPLETED';

-- 3. 既存データのマッピング（StatusHistoryテーブル - toStatus）
UPDATE "StatusHistory" SET "toStatus" = 'REGISTERED' WHERE "toStatus" = 'APPLICATION';
UPDATE "StatusHistory" SET "toStatus" = 'SERVICE_APPLIED' WHERE "toStatus" = 'CONTRACT_SIGNED';
UPDATE "StatusHistory" SET "toStatus" = 'SCHEDULE_ARRANGED' WHERE "toStatus" = 'CLINIC_RESERVED';
UPDATE "StatusHistory" SET "toStatus" = 'STORAGE_ACTIVE' WHERE "toStatus" = 'IPS_COMPLETED';

-- ════════════════════════════════════════
-- 4. コンテンツ更新通知テーブル
-- ════════════════════════════════════════
CREATE TABLE IF NOT EXISTS "ContentUpdate" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "contentId" TEXT,
  "linkUrl" TEXT,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentUpdate_pkey" PRIMARY KEY ("id")
);

-- 5. コンテンツ更新の既読管理テーブル
CREATE TABLE IF NOT EXISTS "ContentUpdateRead" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "contentUpdateId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentUpdateRead_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ContentUpdateRead_userId_contentUpdateId_key" ON "ContentUpdateRead"("userId", "contentUpdateId");
CREATE INDEX IF NOT EXISTS "ContentUpdateRead_userId_idx" ON "ContentUpdateRead"("userId");

-- 6. プッシュ通知サブスクリプションテーブル
CREATE TABLE IF NOT EXISTS "PushSubscription" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");
