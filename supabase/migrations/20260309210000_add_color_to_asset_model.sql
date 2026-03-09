-- Add Color column to AssetModel
ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "Color" TEXT;
