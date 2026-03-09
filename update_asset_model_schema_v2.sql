-- Start transaction
BEGIN;

-- 1. Drop the incorrect column if it exists to fix the type mismatch
ALTER TABLE "AssetModel" DROP COLUMN IF EXISTS "DefaultLocationID";

-- 2. Add DefaultLocationID to AssetModel as TEXT to match StorageLocation.LocationID
ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "DefaultLocationID" TEXT;

-- 3. Add the Foreign Key constraint correctly
ALTER TABLE "AssetModel" ADD CONSTRAINT "AssetModel_DefaultLocationID_fkey" 
FOREIGN KEY ("DefaultLocationID") REFERENCES "StorageLocation"("LocationID") ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Migration: Set DefaultLocationID from the most recent InventoryRecord for each model
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
