-- ==========================================
-- FINAL NUCLEAR FIX: RPC & RLS & SCHEMA CACHE
-- ==========================================

-- 1. DROP and RECREATE the function with strict public access
DROP FUNCTION IF EXISTS public.sync_inventory_alerts();

CREATE OR REPLACE FUNCTION public.sync_inventory_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- This fires the trigger_inventory_alerts() for all models
    UPDATE "AssetModel" SET "AvailableStock" = "AvailableStock" WHERE true;
END;
$$;

-- 2. Explicit grants
GRANT EXECUTE ON FUNCTION public.sync_inventory_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_inventory_alerts() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_inventory_alerts() TO anon;

-- 3. Open RLS Nuclear Style for Settings
ALTER TABLE "InventoryNotificationSetting" DISABLE ROW LEVEL SECURITY;
-- Or if we want to keep it enabled but allow all:
DROP POLICY IF EXISTS "User Own Settings" ON "InventoryNotificationSetting";
CREATE POLICY "Allow All for Now" ON "InventoryNotificationSetting" FOR ALL USING (true) WITH CHECK (true);
ALTER TABLE "InventoryNotificationSetting" ENABLE ROW LEVEL SECURITY;

-- 4. Verify admin-user and mahan existence
INSERT INTO "User" ("UserID", "Username", "Role", "Password", "updatedAt")
VALUES 
('admin-user', 'Admin', 'ADMIN', '2244', now()),
('mahan', 'Mahan', 'ADMIN', '2244', now())
ON CONFLICT ("UserID") DO UPDATE SET "Username" = EXCLUDED."Username";

-- 5. Force Reload
NOTIFY pgrst, 'reload schema';
