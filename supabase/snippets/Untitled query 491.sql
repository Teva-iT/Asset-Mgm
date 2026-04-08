select
  pg_get_functiondef('public.trigger_inventory_alerts()'::regprocedure);


SELECT *
FROM (
  SELECT n.nspname AS schema_name,
         p.proname AS function_name
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE pg_get_functiondef(p.oid) ILIKE '%ON CONFLICT%'
    AND pg_get_functiondef(p.oid) ILIKE '%InventoryAlert%'
) q;


SELECT proname
FROM pg_proc
WHERE pg_get_functiondef(oid) ILIKE '%ON CONFLICT%'
  AND pg_get_functiondef(oid) ILIKE '%InventoryAlert%';




SELECT tgname, tgrelid::regclass, tgfoid::regprocedure
FROM pg_trigger
WHERE NOT tgisinternal
  AND tgrelid = '"AssetModel"'::regclass;
