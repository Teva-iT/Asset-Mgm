-- Start transaction
BEGIN;

-- 1. پاک کردن ستون قبلی برای اصلاح نوع داده
ALTER TABLE "AssetModel" DROP COLUMN IF EXISTS "DefaultLocationID";

-- 2. ساخت ستون جدید با نوع متن (TEXT) برای هماهنگی با جدول انبارها
ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "DefaultLocationID" TEXT;

-- 3. اضافه کردن قید کلید خارجی (Foreign Key)
ALTER TABLE "AssetModel" ADD CONSTRAINT "AssetModel_DefaultLocationID_fkey" 
FOREIGN KEY ("DefaultLocationID") REFERENCES "StorageLocation"("LocationID") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. انتقال داده‌های قبلی بر اساس آخرین تراکنش‌های انبار
UPDATE "AssetModel" am
SET "DefaultLocationID" = ir."StorageLocationID"
FROM (
    SELECT DISTINCT ON ("ModelID") "ModelID", "StorageLocationID"
    FROM "InventoryRecord"
    WHERE "StorageLocationID" IS NOT NULL
    ORDER BY "ModelID", "CreatedAt" DESC
) ir
WHERE am."ModelID" = ir."ModelID"
AND am."DefaultLocationID" IS NULL;

COMMIT;



-- Add Status column to AssetModel table
ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "Status" TEXT;

-- Add Color column to AssetModel
ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "Color" TEXT;

