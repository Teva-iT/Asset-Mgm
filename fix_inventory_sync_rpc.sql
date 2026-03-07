-- ==========================================
-- FIXING MISSING SYNC RPC & REFINING ALERT LOGIC
-- ==========================================

-- 1. Ensure the sync_inventory_alerts RPC exists
-- This function forces a scan of all models by triggering the alert logic for each one.
CREATE OR REPLACE FUNCTION sync_inventory_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Refresh the AvailableStock logic for every model to trigger its check
    -- We use a dummy update to fire the 'trg_check_inventory_stock' trigger
    UPDATE "AssetModel" SET "AvailableStock" = "AvailableStock" WHERE true;
END;
$$;

-- 2. Verify and refine the trigger logic (from inventory_alerts_full_setup.sql)
-- Ensuring it uses the correct lowercase createdAt if it ever needed it, 
-- but it currently doesn't. 
-- However, we make sure it's idempotent.

-- Note: The trigger already exists as:
-- CREATE TRIGGER trg_check_inventory_stock AFTER UPDATE OF "AvailableStock" ON "AssetModel" 
-- FOR EACH ROW EXECUTE FUNCTION trigger_inventory_alerts();
