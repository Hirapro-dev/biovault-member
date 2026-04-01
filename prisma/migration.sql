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
