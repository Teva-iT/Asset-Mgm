-- Inventory Alerts and Settings Schema

-- 1. Alert Rules
-- Allows setting custom thresholds per model or per category.
-- Specific model rules override category rules.
CREATE TABLE IF NOT EXISTS "InventoryAlertRule" (
  "RuleID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ModelID" UUID REFERENCES "AssetModel"("ModelID") ON DELETE CASCADE,
  "Category" TEXT, -- If ModelID is null, applies to whole category
  "LowThreshold" INTEGER NOT NULL DEFAULT 5,
  "CriticalThreshold" INTEGER NOT NULL DEFAULT 2,
  "AlertLevel" TEXT NOT NULL DEFAULT 'Warning', -- Warning, Critical
  "IsEnabled" BOOLEAN DEFAULT true,
  "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "model_or_category" CHECK (("ModelID" IS NOT NULL) OR ("Category" IS NOT NULL))
);

-- 2. Notification Settings
-- Stores user preferences for alert delivery
CREATE TABLE IF NOT EXISTS "InventoryNotificationSetting" (
  "SettingID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "UserID" UUID NOT NULL REFERENCES "User"("UserID") ON DELETE CASCADE,
  "EmailEnabled" BOOLEAN DEFAULT true,
  "SystemEnabled" BOOLEAN DEFAULT true,
  "AlertFrequency" TEXT DEFAULT 'Once', -- Once, Daily, Weekly
  "Recipients" TEXT, -- Comma separated emails, defaults to User's email if empty
  "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE("UserID")
);

-- 3. Active Alerts (Cache/Log)
-- Tracks which alerts have been triggered and their status
CREATE TABLE IF NOT EXISTS "InventoryAlert" (
  "AlertID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ModelID" UUID NOT NULL REFERENCES "AssetModel"("ModelID") ON DELETE CASCADE,
  "Status" TEXT NOT NULL, -- LOW STOCK, CRITICAL, OUT OF STOCK
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

-- Add CriticalThreshold to AssetModel if not already there (for default rules)
ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "CriticalThreshold" INTEGER NOT NULL DEFAULT 2;



-- 4. NOTIFICATION SETTINGS
CREATE TABLE IF NOT EXISTS "InventoryNotificationSetting" (
  "SettingID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "UserID" TEXT NOT NULL REFERENCES "User"("UserID") ON DELETE CASCADE,
  "EmailEnabled" BOOLEAN DEFAULT true,
  "SystemEnabled" BOOLEAN DEFAULT true,
  "AlertFrequency" TEXT DEFAULT 'Once', 
  "Recipients" TEXT, 
  "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE("UserID")
);