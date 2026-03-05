-- Migration: Add ReorderLevel to AssetModel for Low Stock Alert
ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "ReorderLevel" INTEGER NOT NULL DEFAULT 0;
