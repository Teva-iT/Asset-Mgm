-- Dashboard aggregation views for faster home page load.

CREATE OR REPLACE VIEW public.asset_status_counts AS
SELECT
    "Status" AS status,
    COUNT(*)::int AS count
FROM public."Asset"
GROUP BY "Status";

CREATE OR REPLACE VIEW public.asset_type_counts AS
SELECT
    COALESCE(NULLIF("AssetType", ''), 'Uncategorized') AS asset_type,
    COUNT(*)::int AS count
FROM public."Asset"
GROUP BY COALESCE(NULLIF("AssetType", ''), 'Uncategorized');
