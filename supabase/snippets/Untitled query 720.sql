ALTER TABLE "InventoryRecord"
DROP CONSTRAINT IF EXISTS "InventoryRecord_ModelID_fkey";

ALTER TABLE "InventoryRecord"
ADD CONSTRAINT "InventoryRecord_ModelID_fkey"
FOREIGN KEY ("ModelID") REFERENCES "AssetModel"("ModelID")
ON DELETE CASCADE;






ALTER TABLE "InventoryRecord" DROP CONSTRAINT IF EXISTS "InventoryRecord_ModelID_fkey";
ALTER TABLE "InventoryRecord" ADD CONSTRAINT "InventoryRecord_ModelID_fkey" 
  FOREIGN KEY ("ModelID") REFERENCES "AssetModel"("ModelID") ON DELETE CASCADE;