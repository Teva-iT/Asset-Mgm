ALTER TABLE "public"."AssetModel"
ADD COLUMN IF NOT EXISTS "PurchaseDate" timestamp(3) without time zone;
