-- Add DefaultLocationID to AssetModel
ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "DefaultLocationID" UUID REFERENCES "StorageLocation"("LocationID");

-- Migration: Set DefaultLocationID from the most recent InventoryRecord for each model
DO $$
BEGIN
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
END $$;
