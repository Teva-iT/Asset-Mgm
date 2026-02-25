-- ============================================================
-- COMBINED MIGRATION: Enterprise Features
-- Safe to run multiple times (uses IF NOT EXISTS)
-- Run this entire file in Supabase Dashboard → SQL Editor
-- ============================================================

-- ============================================================
-- PHASE 1: Warranty & Financial fields on Asset table
-- ============================================================
ALTER TABLE "Asset"
  ADD COLUMN IF NOT EXISTS "WarrantyExpiryDate"   TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "SupportContractEnd"   TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "VendorName"           TEXT,
  ADD COLUMN IF NOT EXISTS "VendorContact"        TEXT,
  ADD COLUMN IF NOT EXISTS "PurchasePrice"        DECIMAL(10,2);

-- ============================================================
-- PHASE 2: License Management
-- ============================================================
CREATE TABLE IF NOT EXISTS "License" (
  "LicenseID"       TEXT PRIMARY KEY,
  "ProductName"     TEXT NOT NULL,
  "VendorName"      TEXT,
  "LicenseKey"      TEXT,
  "LicenseType"     TEXT NOT NULL DEFAULT 'Per Seat',
  "TotalSeats"      INTEGER,
  "ExpiryDate"      TIMESTAMP,
  "PurchaseDate"    TIMESTAMP,
  "CostPerYear"     DECIMAL(10,2),
  "Notes"           TEXT,
  "Status"          TEXT NOT NULL DEFAULT 'Active',
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "LicenseAssignment" (
  "AssignmentID"  TEXT PRIMARY KEY,
  "LicenseID"     TEXT NOT NULL REFERENCES "License"("LicenseID") ON DELETE CASCADE,
  "EmployeeID"    TEXT REFERENCES "Employee"("EmployeeID") ON DELETE SET NULL,
  "AssetID"       TEXT REFERENCES "Asset"("AssetID") ON DELETE SET NULL,
  "AssignedDate"  TIMESTAMP NOT NULL DEFAULT NOW(),
  "Notes"         TEXT
);

-- ============================================================
-- PHASE 3: Asset Request Workflow
-- ============================================================
CREATE TABLE IF NOT EXISTS "AssetRequest" (
  "RequestID"         TEXT PRIMARY KEY,
  "EmployeeID"        TEXT NOT NULL REFERENCES "Employee"("EmployeeID"),
  "RequestedByUserID" TEXT REFERENCES "User"("UserID"),
  "AssetType"         TEXT NOT NULL,
  "Reason"            TEXT NOT NULL,
  "Urgency"           TEXT NOT NULL DEFAULT 'Normal',
  "NeededByDate"      TIMESTAMP,
  "Status"            TEXT NOT NULL DEFAULT 'Pending',
  "ReviewedByID"      TEXT REFERENCES "User"("UserID"),
  "ReviewNotes"       TEXT,
  "FulfilledAssetID"  TEXT REFERENCES "Asset"("AssetID"),
  "createdAt"         TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VERIFY: Run this to confirm all columns/tables exist
-- ============================================================
SELECT 
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name='Asset' AND column_name='WarrantyExpiryDate') AS "Warranty fields",
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name='License') AS "License table",
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name='LicenseAssignment') AS "LicenseAssignment table",
  (SELECT COUNT(*) FROM information_schema.tables 
   WHERE table_name='AssetRequest') AS "AssetRequest table";
-- Expected result: all columns should show 1
