-- Add Status column to AssetModel table
ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "Status" TEXT;
