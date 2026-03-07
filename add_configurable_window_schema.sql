-- Add ForecastWindowDays to InventoryAlertRule

ALTER TABLE "InventoryAlertRule" 
ADD COLUMN IF NOT EXISTS "ForecastWindowDays" INTEGER DEFAULT 30;

-- Optional: Add index if we frequently query by window
CREATE INDEX IF NOT EXISTS "idx_inventory_alert_rule_window" ON "InventoryAlertRule" ("ForecastWindowDays");
