-- Add stock columns to AssetModel
ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "TotalStock" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "AvailableStock" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "AssignedStock" INTEGER NOT NULL DEFAULT 0;

-- Create InventoryRecord table
CREATE TABLE IF NOT EXISTS "InventoryRecord" (
  "RecordID" TEXT NOT NULL PRIMARY KEY,
  "ModelID" TEXT NOT NULL,
  "Quantity" INTEGER NOT NULL,
  "ActionType" TEXT NOT NULL DEFAULT 'ADD', -- ADD, REMOVE, ADJUST
  "PurchaseDate" TIMESTAMP(3),
  "StorageLocationID" TEXT,
  "Notes" TEXT,
  "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "CreatedByUserID" TEXT,
  FOREIGN KEY ("ModelID") REFERENCES "AssetModel"("ModelID"),
  FOREIGN KEY ("CreatedByUserID") REFERENCES "User"("UserID")
);
