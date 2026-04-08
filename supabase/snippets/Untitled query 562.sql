-- 1. Updates to AssetModel
ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "TotalStock" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "AvailableStock" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "AssignedStock" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "ReorderLevel" INTEGER NOT NULL DEFAULT 0;
 
-- 2. Proper Inventory Ledger
CREATE TABLE IF NOT EXISTS "InventoryRecord" (
  "RecordID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ModelID" UUID NOT NULL REFERENCES "AssetModel"("ModelID"),
  "Quantity" INTEGER NOT NULL,
  "ActionType" TEXT NOT NULL, -- ADD, ASSIGN, RETURN, ADJUST
  "AssetID" UUID REFERENCES "Asset"("AssetID"), -- Nullable if bulk
  "AssignmentID" UUID REFERENCES "Assignment"("AssignmentID"), -- Nullable
  "PurchaseDate" TIMESTAMP WITH TIME ZONE,
  "StorageLocationID" UUID REFERENCES "StorageLocation"("LocationID"),
  "Notes" TEXT,
  "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "CreatedByUserID" UUID REFERENCES "User"("UserID")
);
 
-- 3. Atomic Assignment RPC (Handles Stock & Assignment in one transaction)
CREATE OR REPLACE FUNCTION assign_asset_atomic(
    p_assignment_id UUID,
    p_asset_id UUID,
    p_employee_id TEXT,
    p_expected_return_date TIMESTAMP WITH TIME ZONE,
    p_notes TEXT,
    p_assigned_by_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_model_id UUID;
    v_available INTEGER;
BEGIN
    -- 1. Get model and lock for update
    SELECT "ModelID", "AvailableStock" INTO v_model_id, v_available
    FROM "AssetModel"
    WHERE "ModelID" = (SELECT "ModelID" FROM "Asset" WHERE "AssetID" = p_asset_id)
    FOR UPDATE;
 
    -- 2. Check stock
    IF v_available <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock');
    END IF;
 
    -- 3. Update Asset
    UPDATE "Asset" SET "Status" = 'Assigned' WHERE "AssetID" = p_asset_id;
 
    -- 4. Create Assignment
    INSERT INTO "Assignment" (
        "AssignmentID", "AssetID", "EmployeeID", "AssignedDate", "ExpectedReturnDate", "Notes", "Status"
    ) VALUES (
        p_assignment_id, p_asset_id, p_employee_id, now(), p_expected_return_date, p_notes, 'Active'
    );
 
    -- 5. Update Stock Counts
    UPDATE "AssetModel"
    SET "AvailableStock" = "AvailableStock" - 1,
        "AssignedStock" = "AssignedStock" + 1
    WHERE "ModelID" = v_model_id;
 
    RETURN jsonb_build_object('success', true);
END;
$$;