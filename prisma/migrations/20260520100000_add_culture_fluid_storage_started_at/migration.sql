-- CultureFluidOrder に管理保管開始日カラムを追加
-- 「iPS培養上清液の精製」と「管理保管」を別アクションに分離するため、
-- 管理者が個別に保管開始日を入力する。
--
-- 開発環境で先に prisma db push を行ったケースでも安全に流せるよう、
-- IF NOT EXISTS で冪等化している。
ALTER TABLE "CultureFluidOrder" ADD COLUMN IF NOT EXISTS "storageStartedAt" TIMESTAMP(3);

-- 既存データの後方互換性:
-- producedAt と expiresAt が両方セット済みの古いレコードは、これまで
-- 「保管開始済み」として扱われていたため、storageStartedAt に producedAt をコピーする。
-- 既に storageStartedAt がセット済みのレコードは上書きしない（冪等）。
UPDATE "CultureFluidOrder"
SET "storageStartedAt" = "producedAt"
WHERE "producedAt" IS NOT NULL
  AND "expiresAt" IS NOT NULL
  AND "storageStartedAt" IS NULL;
