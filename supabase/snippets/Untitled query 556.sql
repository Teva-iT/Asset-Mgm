CREATE TABLE IF NOT EXISTS "InventoryRecord" (
  "RecordID" TEXT NOT NULL PRIMARY KEY,
  "ModelID" TEXT NOT NULL,
  "Quantity" INTEGER NOT NULL,
  "ActionType" TEXT NOT NULL DEFAULT 'ADD',
  "PurchaseDate" TIMESTAMP(3),
  "StorageLocationID" TEXT,
  "Notes" TEXT,
  "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "CreatedByUserID" TEXT,
  FOREIGN KEY ("ModelID") REFERENCES "AssetModel"("ModelID") ON DELETE CASCADE,
  FOREIGN KEY ("CreatedByUserID") REFERENCES "User"("UserID")
);

ALTER TABLE "InventoryRecord"
DROP CONSTRAINT IF EXISTS "InventoryRecord_ModelID_fkey";

ALTER TABLE "InventoryRecord"
ADD CONSTRAINT "InventoryRecord_ModelID_fkey"
FOREIGN KEY ("ModelID") REFERENCES "AssetModel"("ModelID")
ON DELETE CASCADE;

