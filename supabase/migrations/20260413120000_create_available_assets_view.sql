-- Speed up inventory page by pre-filtering available assets (no Active assignment)

CREATE OR REPLACE VIEW public.available_assets AS
SELECT
    a."AssetID",
    a."AssetType",
    a."Condition",
    a."OperationalState"
FROM public."Asset" a
LEFT JOIN public."Assignment" asgn
    ON asgn."AssetID" = a."AssetID"
   AND asgn."Status" = 'Active'
WHERE asgn."AssignmentID" IS NULL;

-- Helpful index for fast anti-join
CREATE INDEX IF NOT EXISTS "Assignment_AssetID_Status_idx"
    ON public."Assignment" ("AssetID", "Status");
