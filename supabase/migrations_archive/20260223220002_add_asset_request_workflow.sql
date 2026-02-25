-- Phase 3: Asset Request Workflow
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
