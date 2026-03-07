-- Fix Alert Lifecycle Column Type (AcknowledgedBy should be TEXT to match UserID)

ALTER TABLE "InventoryAlert" 
DROP COLUMN IF EXISTS "AcknowledgedBy";

ALTER TABLE "InventoryAlert" 
ADD COLUMN IF NOT EXISTS "AcknowledgedBy" TEXT REFERENCES "User"("UserID");
