CREATE TABLE "License" (
  "LicenseID"       TEXT PRIMARY KEY,
  "ProductName"     TEXT NOT NULL,
  "VendorName"      TEXT,
  "LicenseKey"      TEXT,
  "LicenseType"     TEXT DEFAULT 'Per Seat',  -- Per Seat | Site | Device
  "TotalSeats"      INTEGER,
  "ExpiryDate"      TIMESTAMP,
  "PurchaseDate"    TIMESTAMP,
  "CostPerYear"     DECIMAL(10,2),
  "Notes"           TEXT,
  "Status"          TEXT DEFAULT 'Active',
  "createdAt"       TIMESTAMP DEFAULT NOW(),
  "updatedAt"       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE "LicenseAssignment" (
  "AssignmentID"  TEXT PRIMARY KEY,
  "LicenseID"     TEXT NOT NULL REFERENCES "License"("LicenseID"),
  "EmployeeID"    TEXT REFERENCES "Employee"("EmployeeID"),
  "AssetID"       TEXT REFERENCES "Asset"("AssetID"),
  "AssignedDate"  TIMESTAMP DEFAULT NOW(),
  "Notes"         TEXT
);
