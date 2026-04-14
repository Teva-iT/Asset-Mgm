-- Migration: Atomic asset allocation that decrements model stock and creates an asset row.

CREATE OR REPLACE FUNCTION allocate_asset_atomic(
  p_model_id TEXT,
  p_location_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_model "AssetModel"%ROWTYPE;
  v_asset_id TEXT;
  v_status TEXT;
  v_asset_name TEXT;
BEGIN
  -- Lock and read model
  SELECT * INTO v_model FROM "AssetModel" WHERE "ModelID" = p_model_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Model not found');
  END IF;

  IF v_model."AvailableStock" <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No available stock remaining for this model');
  END IF;

  -- Pick a valid status from AssetStatus table
  SELECT "Name" INTO v_status
  FROM "AssetStatus"
  WHERE "Name" IN ('Available', 'In Stock', 'Stock', 'In-Stock')
  ORDER BY CASE "Name"
    WHEN 'Available' THEN 1
    WHEN 'In Stock' THEN 2
    WHEN 'Stock' THEN 3
    WHEN 'In-Stock' THEN 4
    ELSE 5
  END
  LIMIT 1;

  IF v_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'AssetStatus missing Available/In Stock status');
  END IF;

  v_asset_id := gen_random_uuid()::text;
  v_asset_name := COALESCE(v_model."Name", 'Asset');

  -- Create Asset
  INSERT INTO "Asset" (
    "AssetID",
    "ModelID",
    "AssetName",
    "AssetType",
    "OwnershipType",
    "Status",
    "StorageLocationID",
    "updatedAt"
  ) VALUES (
    v_asset_id,
    v_model."ModelID",
    v_asset_name,
    v_model."Category",
    'Individual',
    v_status,
    COALESCE(p_location_id, v_model."DefaultLocationID"),
    NOW()
  );

  -- Decrement stock atomically
  UPDATE "AssetModel"
  SET
    "AvailableStock" = GREATEST(0, "AvailableStock" - 1),
    "AssignedStock"  = "AssignedStock",
    "updatedAt"      = NOW()
  WHERE "ModelID" = v_model."ModelID";

  RETURN jsonb_build_object('success', true, 'assetId', v_asset_id);
END;
$$;
