INSERT INTO "public"."ModelPhoto" (
    "PhotoID",
    "ModelID",
    "URL",
    "Category",
    "SortOrder",
    "UploadedBy"
)
SELECT
    md5(random()::text || clock_timestamp()::text) as "PhotoID",
    am."ModelID",
    am."ImageURL",
    'Reference' as "Category",
    0 as "SortOrder",
    null as "UploadedBy"
FROM "public"."AssetModel" am
WHERE am."ImageURL" IS NOT NULL
  AND am."ImageURL" <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM "public"."ModelPhoto" mp
    WHERE mp."ModelID" = am."ModelID"
      AND mp."URL" = am."ImageURL"
  );


  SELECT
    am."ModelID",
    am."Name",
    am."ImageURL",
    COUNT(mp."PhotoID") as photo_count
FROM "public"."AssetModel" am
LEFT JOIN "public"."ModelPhoto" mp
    ON mp."ModelID" = am."ModelID"
GROUP BY am."ModelID", am."Name", am."ImageURL"
ORDER BY am."Name";


SELECT
    "ModelID",
    "Name",
    "PurchaseDate",
    "ImageURL"
FROM "public"."AssetModel"
ORDER BY "updatedAt" DESC
LIMIT 20;


SELECT
    mp."ModelID",
    am."Name",
    mp."URL",
    mp."Category",
    mp."SortOrder",
    mp."createdAt"
FROM "public"."ModelPhoto" mp
JOIN "public"."AssetModel" am
    ON am."ModelID" = mp."ModelID"
ORDER BY am."Name", mp."SortOrder", mp."createdAt";


SELECT
    am."Name",
    am."PurchaseDate",
    COUNT(mp."PhotoID") AS photo_count
FROM "public"."AssetModel" am
LEFT JOIN "public"."ModelPhoto" mp
    ON mp."ModelID" = am."ModelID"
GROUP BY am."ModelID", am."Name", am."PurchaseDate"
ORDER BY am."updatedAt" DESC
LIMIT 20;