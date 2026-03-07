-- Refined Inventory Alerts and Settings Schema

-- 1. Automatic Timestamp Function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."UpdatedAt" = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Alert Rules
-- Allows setting custom thresholds per model or per category.
-- Specific model rules override category rules.
CREATE TABLE IF NOT EXISTS "InventoryAlertRule" (
  "RuleID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ModelID" UUID REFERENCES "AssetModel"("ModelID") ON DELETE CASCADE,
  "Category" TEXT, -- XOR with ModelID. Should align with AssetModel.Category
  "LowThreshold" INTEGER NOT NULL DEFAULT 5,
  "CriticalThreshold" INTEGER NOT NULL DEFAULT 2,
  "IsEnabled" BOOLEAN DEFAULT true,
  "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "model_xor_category" CHECK (
    (("ModelID" IS NOT NULL) AND ("Category" IS NULL)) OR 
    (("ModelID" IS NULL) AND ("Category" IS NOT NULL))
  )
);

-- Trigger for UpdatedAt
DROP TRIGGER IF EXISTS trg_set_timestamp_alert_rule ON "InventoryAlertRule";
CREATE TRIGGER trg_set_timestamp_alert_rule
BEFORE UPDATE ON "InventoryAlertRule"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- 3. Notification Settings
CREATE TABLE IF NOT EXISTS "InventoryNotificationSetting" (
  "SettingID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "UserID" UUID NOT NULL REFERENCES "User"("UserID") ON DELETE CASCADE,
  "EmailEnabled" BOOLEAN DEFAULT true,
  "SystemEnabled" BOOLEAN DEFAULT true,
  "AlertFrequency" TEXT DEFAULT 'Once',
  "Recipients" TEXT,
  "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE("UserID")
);

DROP TRIGGER IF EXISTS trg_set_timestamp_notification_setting ON "InventoryNotificationSetting";
CREATE TRIGGER trg_set_timestamp_notification_setting
BEFORE UPDATE ON "InventoryNotificationSetting"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- 4. Active Alerts
CREATE TABLE IF NOT EXISTS "InventoryAlert" (
  "AlertID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ModelID" UUID NOT NULL REFERENCES "AssetModel"("ModelID") ON DELETE CASCADE,
  "Status" TEXT NOT NULL,
  "CurrentStock" INTEGER NOT NULL,
  "ThresholdAtTrigger" INTEGER NOT NULL,
  "IsResolved" BOOLEAN DEFAULT false,
  "ResolvedAt" TIMESTAMP WITH TIME ZONE,
  "IsSnoozed" BOOLEAN DEFAULT false,
  "SnoozedUntil" TIMESTAMP WITH TIME ZONE,
  "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "LastNotifiedAt" TIMESTAMP WITH TIME ZONE
);

-- Index for performance
CREATE INDEX IF NOT EXISTS "idx_inventory_alert_active" ON "InventoryAlert" ("ModelID") WHERE "IsResolved" = false;
CREATE INDEX IF NOT EXISTS "idx_inventory_alert_rule_model" ON "InventoryAlertRule" ("ModelID");
CREATE INDEX IF NOT EXISTS "idx_inventory_alert_rule_category" ON "InventoryAlertRule" ("Category");

-- Ensure no duplicate active alerts per model
CREATE UNIQUE INDEX IF NOT EXISTS "idx_inventory_alert_unique_active" ON "InventoryAlert" ("ModelID") WHERE "IsResolved" = false;
