CREATE TABLE "AssetRequest" (
  "RequestID"       TEXT PRIMARY KEY,
  "EmployeeID"      TEXT NOT NULL REFERENCES "Employee"("EmployeeID"),
  "AssetType"       TEXT NOT NULL,
  "Reason"          TEXT NOT NULL,
  "Urgency"         TEXT DEFAULT 'Normal',   -- Low | Normal | High | Critical
  "NeededByDate"    TIMESTAMP,
  "Status"          TEXT DEFAULT 'Pending',  -- Pending | Approved | Rejected | Fulfilled
  "ReviewedByID"    TEXT REFERENCES "User"("UserID"),
  "ReviewNotes"     TEXT,
  "FulfilledAssetID" TEXT REFERENCES "Asset"("AssetID"),
  "createdAt"       TIMESTAMP DEFAULT NOW(),
  "updatedAt"       TIMESTAMP DEFAULT NOW()
);
