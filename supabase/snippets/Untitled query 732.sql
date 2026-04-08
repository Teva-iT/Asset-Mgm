-- ==========================================
-- CONSOLIDATED INVENTORY HEALTH & ALERTS SCHEMA
-- Includes: Tables, Triggers, Indexes, and RLS Policies
-- ==========================================

-- 1. EXTENSIONS & FUNCTIONS
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."UpdatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. TABLE UPDATES (AssetModel)
ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "ReorderLevel" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "CriticalThreshold" INTEGER NOT NULL DEFAULT 2;

-- 3. INVENTORY ALERT RULES
CREATE TABLE IF NOT EXISTS "InventoryAlertRule" (
  "RuleID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ModelID" TEXT REFERENCES "AssetModel"("ModelID") ON DELETE CASCADE,
  "Category" TEXT, 
  "LowThreshold" INTEGER NOT NULL DEFAULT 5,
  "CriticalThreshold" INTEGER NOT NULL DEFAULT 2,
  "ForecastWindowDays" INTEGER DEFAULT 30,
  "PredictiveThresholdDays" INTEGER DEFAULT 10,
  "LeadTimeDays" INTEGER DEFAULT 3,
  "IsEnabled" BOOLEAN DEFAULT true,
  "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT "model_or_category" CHECK (("ModelID" IS NOT NULL) OR ("Category" IS NOT NULL)),
  CONSTRAINT "model_xor_category" CHECK (("ModelID" IS NULL) OR ("Category" IS NULL)) -- XOR Logic
);

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

-- 5. INVENTORY ALERTS
CREATE TABLE IF NOT EXISTS "InventoryAlert" (
  "AlertID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ModelID" TEXT NOT NULL REFERENCES "AssetModel"("ModelID") ON DELETE CASCADE,
  "Status" TEXT NOT NULL, -- LOW STOCK, CRITICAL, OUT OF STOCK
  "CurrentStock" INTEGER NOT NULL,
  "ThresholdAtTrigger" INTEGER NOT NULL,
  "IsAcknowledged" BOOLEAN DEFAULT false,
  "AcknowledgedBy" TEXT REFERENCES "User"("UserID"),
  "AcknowledgedAt" TIMESTAMP WITH TIME ZONE,
  "IsResolved" BOOLEAN DEFAULT false,
  "ResolvedAt" TIMESTAMP WITH TIME ZONE,
  "IsSnoozed" BOOLEAN DEFAULT false,
  "SnoozedUntil" TIMESTAMP WITH TIME ZONE,
  "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "LastNotifiedAt" TIMESTAMP WITH TIME ZONE
);

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS "idx_inventory_alert_active" ON "InventoryAlert" ("ModelID") WHERE "IsResolved" = false;
CREATE INDEX IF NOT EXISTS "idx_inventory_alert_unacknowledged" ON "InventoryAlert" ("ModelID") WHERE "IsResolved" = false AND "IsAcknowledged" = false;
CREATE INDEX IF NOT EXISTS "idx_inventory_alert_rule_model" ON "InventoryAlertRule" ("ModelID");
CREATE INDEX IF NOT EXISTS "idx_inventory_alert_rule_category" ON "InventoryAlertRule" ("Category");

-- 7. AUTOMATIC UPDATED_AT TRIGGERS
CREATE TRIGGER trg_set_timestamp_alert_rule BEFORE UPDATE ON "InventoryAlertRule" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER trg_set_timestamp_notification BEFORE UPDATE ON "InventoryNotificationSetting" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER trg_set_timestamp_alert BEFORE UPDATE ON "InventoryAlert" FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 8. ALERT GENERATION ENGINE (TRIGGER)
CREATE OR REPLACE FUNCTION trigger_inventory_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_low_threshold INTEGER;
    v_critical_threshold INTEGER;
    v_status TEXT;
    v_category TEXT;
BEGIN
    SELECT "Category" INTO v_category FROM "AssetModel" WHERE "ModelID" = NEW."ModelID";

    -- Priority: Model Rule > Category Rule > AssetModel Defaults
    SELECT "LowThreshold", "CriticalThreshold" INTO v_low_threshold, v_critical_threshold
    FROM "InventoryAlertRule" WHERE "ModelID" = NEW."ModelID" AND "IsEnabled" = true;

    IF v_low_threshold IS NULL THEN
        SELECT "LowThreshold", "CriticalThreshold" INTO v_low_threshold, v_critical_threshold
        FROM "InventoryAlertRule" WHERE "Category" = v_category AND "IsEnabled" = true LIMIT 1;
    END IF;

    IF v_low_threshold IS NULL THEN
        SELECT "ReorderLevel", "CriticalThreshold" INTO v_low_threshold, v_critical_threshold
        FROM "AssetModel" WHERE "ModelID" = NEW."ModelID";
    END IF;

    v_low_threshold := COALESCE(v_low_threshold, 5);
    v_critical_threshold := COALESCE(v_critical_threshold, 2);

    IF NEW."AvailableStock" = 0 THEN
        v_status := 'OUT OF STOCK';
    ELSIF NEW."AvailableStock" <= v_critical_threshold THEN
        v_status := 'CRITICAL';
    ELSIF NEW."AvailableStock" <= v_low_threshold THEN
        v_status := 'LOW STOCK';
    ELSE
        UPDATE "InventoryAlert" SET "IsResolved" = true, "ResolvedAt" = now()
        WHERE "ModelID" = NEW."ModelID" AND "IsResolved" = false;
        RETURN NEW;
    END IF;

    INSERT INTO "InventoryAlert" ("ModelID", "Status", "CurrentStock", "ThresholdAtTrigger", "IsResolved")
    VALUES (NEW."ModelID", v_status, NEW."AvailableStock", v_low_threshold, false)
    ON CONFLICT ("ModelID") WHERE "IsResolved" = false
    DO UPDATE SET
        "Status" = EXCLUDED."Status",
        "CurrentStock" = EXCLUDED."CurrentStock",
        "ThresholdAtTrigger" = EXCLUDED."ThresholdAtTrigger",
        "UpdatedAt" = now();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_inventory_stock ON "AssetModel";
CREATE TRIGGER trg_check_inventory_stock AFTER UPDATE OF "AvailableStock" ON "AssetModel" FOR EACH ROW EXECUTE FUNCTION trigger_inventory_alerts();

-- 9. ROW LEVEL SECURITY (RLS)
ALTER TABLE "InventoryAlertRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryNotificationSetting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InventoryAlert" ENABLE ROW LEVEL SECURITY;

-- Default Policy: Admins can do anything, Viewers can only read
CREATE POLICY "Admin All Access" ON "InventoryAlert" FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "User" WHERE "UserID" = auth.uid()::text AND "Role" = 'ADMIN'));
CREATE POLICY "Viewer Read Access" ON "InventoryAlert" FOR SELECT TO authenticated USING (true);

-- Repeat for other tables
CREATE POLICY "Admin All Access Rules" ON "InventoryAlertRule" FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "User" WHERE "UserID" = auth.uid()::text AND "Role" = 'ADMIN'));
CREATE POLICY "Viewer Read Access Rules" ON "InventoryAlertRule" FOR SELECT TO authenticated USING (true);

-- Notification Settings: User can see/update their own, Admin sees all
CREATE POLICY "Admin All Access Settings" ON "InventoryNotificationSetting" FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM "User" WHERE "UserID" = auth.uid()::text AND "Role" = 'ADMIN'));
CREATE POLICY "User Own Settings" ON "InventoryNotificationSetting" FOR ALL TO authenticated USING ("UserID" = auth.uid()::text);
