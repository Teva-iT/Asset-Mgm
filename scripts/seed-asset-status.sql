-- Safe seed for AssetStatus (non-destructive).
-- Inserts common statuses only if missing.

INSERT INTO public."AssetStatus" ("Name", "Color", "Description")
SELECT v.name, v.color, v.description
FROM (VALUES
    ('Available', '#10B981', 'Available for assignment'),
    ('In Stock', '#16A34A', 'In stock / ready'),
    ('Assigned', '#3B82F6', 'Assigned to an employee'),
    ('Lost', '#F59E0B', 'Reported lost'),
    ('Damaged', '#EF4444', 'Damaged / needs repair'),
    ('Retired', '#6B7280', 'Retired from service')
) AS v(name, color, description)
WHERE NOT EXISTS (
    SELECT 1 FROM public."AssetStatus" s WHERE s."Name" = v.name
);
