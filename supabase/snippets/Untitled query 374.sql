CREATE OR REPLACE FUNCTION public.trigger_inventory_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_low_threshold INTEGER;
    v_critical_threshold INTEGER;
    v_status TEXT;
    v_category TEXT;
BEGIN
    SELECT "Category"
    INTO v_category
    FROM "AssetModel"
    WHERE "ModelID" = NEW."ModelID";

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

    v_low_threshold := COALESCE(v_low_threshold, 5);
    v_critical_threshold := COALESCE(v_critical_threshold, 2);

    IF NEW."AvailableStock" = 0 THEN
        v_status := 'OUT OF STOCK';
    ELSIF NEW."AvailableStock" <= v_critical_threshold THEN
        v_status := 'CRITICAL';
    ELSIF NEW."AvailableStock" <= v_low_threshold THEN
        v_status := 'LOW STOCK';
    ELSE
        UPDATE "InventoryAlert"
        SET "IsResolved" = true, "ResolvedAt" = now()
        WHERE "ModelID" = NEW."ModelID" AND "IsResolved" = false;

        RETURN NEW;
    END IF;

    UPDATE "InventoryAlert"
    SET
        "Status" = v_status,
        "CurrentStock" = NEW."AvailableStock",
        "ThresholdAtTrigger" = v_low_threshold,
        "UpdatedAt" = now()
    WHERE "ModelID" = NEW."ModelID" AND "IsResolved" = false;

    IF NOT FOUND THEN
        INSERT INTO "InventoryAlert" (
            "ModelID",
            "Status",
            "CurrentStock",
            "ThresholdAtTrigger",
            "IsResolved"
        )
        VALUES (
            NEW."ModelID",
            v_status,
            NEW."AvailableStock",
            v_low_threshold,
            false
        );
    END IF;

    RETURN NEW;
END;
$$;
