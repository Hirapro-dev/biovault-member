-- CultureFluidOrder にクリニック予約申込日時カラムを追加
ALTER TABLE "CultureFluidOrder" ADD COLUMN "clinicBookingRequestedAt" TIMESTAMP(3);
