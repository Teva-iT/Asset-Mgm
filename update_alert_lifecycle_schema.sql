-- Alert Lifecycle Expansion - Adding Acknowledgement Columns

ALTER TABLE "InventoryAlert" 
ADD COLUMN IF NOT EXISTS "IsAcknowledged" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "AcknowledgedBy" UUID REFERENCES "User"("UserID"),
ADD COLUMN IF NOT EXISTS "AcknowledgedAt" TIMESTAMP WITH TIME ZONE;

-- Add index for active/unacknowledged alerts
CREATE INDEX IF NOT EXISTS "idx_inventory_alert_unacknowledged" ON "InventoryAlert" ("ModelID") WHERE "IsResolved" = false AND "IsAcknowledged" = false;
