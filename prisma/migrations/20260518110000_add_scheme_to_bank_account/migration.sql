-- BankAccountテーブルに scheme カラムを追加
-- 既存レコードはすべて 'SCPP' でバックフィルする
ALTER TABLE "BankAccount" ADD COLUMN "scheme" "Scheme" NOT NULL DEFAULT 'SCPP';
