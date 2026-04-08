-- Refined Inventory Alert Engine - Enhanced duplicate prevention and removal of redundant AlertLevel

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
    -- 1. Get thresholds
    SELECT "Category" INTO v_category FROM "AssetModel" WHERE "ModelID" = NEW."ModelID";

    -- Rule priority: Model-specific > Category-specific > AssetModel defaults
    SELECT "LowThreshold", "CriticalThreshold"
    INTO v_low_threshold, v_critical_threshold
    FROM "InventoryAlertRule"
    WHERE "ModelID" = NEW."ModelID" AND "IsEnabled" = true;

    IF v_low_threshold IS NULL THEN
        SELECT "LowThreshold", "CriticalThreshold"
        INTO v_low_threshold, v_critical_threshold
        FROM "InventoryAlertRule"
        WHERE "Category" = v_category AND "IsEnabled" = true
        LIMIT 1;
    END IF;

    IF v_low_threshold IS NULL THEN
        SELECT "ReorderLevel", "CriticalThreshold"
        INTO v_low_threshold, v_critical_threshold
        FROM "AssetModel"
        WHERE "ModelID" = NEW."ModelID";
    END IF;

    -- Defaults
    v_low_threshold := COALESCE(v_low_threshold, 5);
    v_critical_threshold := COALESCE(v_critical_threshold, 2);

    -- 2. Determine Status
    IF NEW."AvailableStock" = 0 THEN
        v_status := 'OUT OF STOCK';
    ELSIF NEW."AvailableStock" <= v_critical_threshold THEN
        v_status := 'CRITICAL';
    ELSIF NEW."AvailableStock" <= v_low_threshold THEN
        v_status := 'LOW STOCK';
    ELSE
        -- Stock is healthy, resolve any active alerts
        UPDATE "InventoryAlert"
        SET "IsResolved" = true, "ResolvedAt" = now()
        WHERE "ModelID" = NEW."ModelID" AND "IsResolved" = false;
        
        RETURN NEW;
    END IF;

    -- 3. Update any active alerts first; insert only when there is no active alert yet.
    -- This avoids requiring a UNIQUE/EXCLUSION constraint for ON CONFLICT.
    UPDATE "InventoryAlert"
    SET
        "Status" = v_status,
        "CurrentStock" = NEW."AvailableStock",
        "ThresholdAtTrigger" = v_low_threshold,
        "UpdatedAt" = now()
    WHERE "ModelID" = NEW."ModelID" AND "IsResolved" = false;

    IF NOT FOUND THEN
        INSERT INTO "InventoryAlert" (
            "ModelID", "Status", "CurrentStock", "ThresholdAtTrigger", "IsResolved"
        )
        VALUES (
            NEW."ModelID", v_status, NEW."AvailableStock", v_low_threshold, false
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger on AssetModel update
DROP TRIGGER IF EXISTS trg_check_inventory_stock ON "AssetModel";
CREATE TRIGGER trg_check_inventory_stock
AFTER UPDATE OF "AvailableStock" ON "AssetModel"
FOR EACH ROW
EXECUTE FUNCTION trigger_inventory_alerts();

-- Sync to refresh all alerts
SELECT sync_inventory_alerts();
