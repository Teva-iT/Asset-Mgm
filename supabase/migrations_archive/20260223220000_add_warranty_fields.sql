-- Phase 1: Add Warranty & Financial fields to Asset table
ALTER TABLE "Asset"
  ADD COLUMN IF NOT EXISTS "WarrantyExpiryDate"   TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "SupportContractEnd"   TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "VendorName"           TEXT,
  ADD COLUMN IF NOT EXISTS "VendorContact"        TEXT,
  ADD COLUMN IF NOT EXISTS "PurchasePrice"        DECIMAL(10,2);
