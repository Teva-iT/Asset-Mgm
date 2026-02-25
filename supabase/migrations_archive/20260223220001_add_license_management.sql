-- Phase 2: License Management tables
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
