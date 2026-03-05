-- Migration: Add atomic assignment function
-- Run this in Supabase Studio SQL Editor or via supabase db push

CREATE OR REPLACE FUNCTION assign_asset_atomic(
  p_assignment_id TEXT,
  p_asset_id TEXT,
  p_employee_id TEXT,
  p_expected_return_date TIMESTAMPTZ,
  p_notes TEXT,
  p_assigned_by_user_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_asset "Asset"%ROWTYPE;
  v_model "AssetModel"%ROWTYPE;
BEGIN
  -- Lock and read the asset
  SELECT * INTO v_asset FROM "Asset" WHERE "AssetID" = p_asset_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Asset not found');
  END IF;

  IF v_asset."Status" != 'Available' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Asset is not available');
  END IF;

  -- Guard: check model stock
  IF v_asset."ModelID" IS NOT NULL THEN
    SELECT * INTO v_model FROM "AssetModel" WHERE "ModelID" = v_asset."ModelID" FOR UPDATE;
    IF v_model."AvailableStock" <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'No available stock remaining for this model');
    END IF;
  END IF;

  -- All checks passed — create assignment
  INSERT INTO "Assignment" (
    "AssignmentID", "AssetID", "EmployeeID",
    "ExpectedReturnDate", "Notes", "Status",
    "AssignedByUserID", "updatedAt"
  ) VALUES (
    p_assignment_id, p_asset_id, p_employee_id,
    p_expected_return_date, p_notes, 'Active',
    p_assigned_by_user_id, NOW()
  );

  -- Update asset status
  UPDATE "Asset" SET "Status" = 'Assigned', "updatedAt" = NOW()
  WHERE "AssetID" = p_asset_id;

  -- Update model stock
  IF v_asset."ModelID" IS NOT NULL THEN
    UPDATE "AssetModel"
    SET
      "AvailableStock" = GREATEST(0, "AvailableStock" - 1),
      "AssignedStock"  = "AssignedStock" + 1,
      "updatedAt"      = NOW()
    WHERE "ModelID" = v_asset."ModelID";
  END IF;

  RETURN jsonb_build_object('success', true, 'assignmentId', p_assignment_id);
END;
$$;
