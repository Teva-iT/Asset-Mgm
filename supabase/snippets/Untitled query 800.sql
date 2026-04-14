-- Safe, non-destructive department seed.
-- 1) Backfill from existing Employee.Department values.
-- 2) Optionally add a manual list without deleting anything.

-- Backfill from Employee table (no deletes).
INSERT INTO public.department (name)
SELECT DISTINCT TRIM(e."Department") AS name
FROM public."Employee" e
WHERE e."Department" IS NOT NULL
  AND TRIM(e."Department") <> ''
  AND NOT EXISTS (
      SELECT 1
      FROM public.department d
      WHERE LOWER(d.name) = LOWER(TRIM(e."Department"))
  );

-- Optional manual list. Uncomment and edit if you want to force-add.
-- INSERT INTO public.department (name)
-- SELECT name
-- FROM (VALUES
--     ('IT'),
--     ('HR'),
--     ('Finance')
-- ) AS v(name)
-- WHERE NOT EXISTS (
--     SELECT 1 FROM public.department d WHERE LOWER(d.name) = LOWER(v.name)
-- );
