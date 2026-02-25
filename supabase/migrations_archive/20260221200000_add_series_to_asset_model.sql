-- Add Series field to AssetModel table
ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "Series" TEXT;
