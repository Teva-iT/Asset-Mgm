-- Database Schema generated from prisma/schema.prisma

CREATE TABLE "ScanHistory" (
  "ScanID" TEXT NOT NULL PRIMARY KEY,
  "ScannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "Outcome" TEXT NOT NULL,
  "Method" TEXT NOT NULL,
  "Query" TEXT,
  "CalculatedStatus" TEXT,
  "AssetID" TEXT,
  "ScannedByUserID" TEXT,
  FOREIGN KEY ("AssetID") REFERENCES "Asset"("AssetID"),
  FOREIGN KEY ("ScannedByUserID") REFERENCES "User"("UserID")
);

CREATE TABLE "Asset" (
  "AssetID" TEXT NOT NULL PRIMARY KEY,
  "ModelID" TEXT,
  "AssetType" TEXT,
  "OwnershipType" TEXT,
  "Quantity" INTEGER DEFAULT 1,
  "Location" TEXT,
  "AssetName" TEXT,
  "Brand" TEXT,
  "Model" TEXT,
  "SerialNumber" TEXT UNIQUE,
  "AssetTag" TEXT UNIQUE,
  "DeviceTag" TEXT UNIQUE,
  "Status" TEXT,
  "Condition" TEXT,
  "OperationalState" TEXT,
  "PurchaseDate" TIMESTAMP(3),
  "Notes" TEXT,
  "ProcurementItemID" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("ModelID") REFERENCES "AssetModel"("ModelID"),
  FOREIGN KEY ("ProcurementItemID") REFERENCES "ProcurementItem"("ItemID")
);

CREATE TABLE "AssetPhoto" (
  "PhotoID" TEXT NOT NULL PRIMARY KEY,
  "AssetID" TEXT NOT NULL,
  "URL" TEXT NOT NULL,
  "Category" TEXT NOT NULL DEFAULT 'General',
  "UploadedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("AssetID") REFERENCES "Asset"("AssetID")
);

CREATE TABLE "Employee" (
  "EmployeeID" TEXT NOT NULL PRIMARY KEY,
  "FirstName" TEXT NOT NULL,
  "LastName" TEXT NOT NULL,
  "Email" TEXT NOT NULL UNIQUE,
  "Slug" TEXT UNIQUE,
  "Department" TEXT NOT NULL,
  "StartDate" TIMESTAMP(3) NOT NULL,
  "EndDate" TIMESTAMP(3),
  "Status" TEXT NOT NULL DEFAULT 'Active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Assignment" (
  "AssignmentID" TEXT NOT NULL PRIMARY KEY,
  "AssetID" TEXT NOT NULL,
  "EmployeeID" TEXT NOT NULL,
  "AssignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ExpectedReturnDate" TIMESTAMP(3),
  "ActualReturnDate" TIMESTAMP(3),
  "Status" TEXT NOT NULL,
  "Notes" TEXT,
  "AssignedByUserID" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("AssetID") REFERENCES "Asset"("AssetID"),
  FOREIGN KEY ("EmployeeID") REFERENCES "Employee"("EmployeeID"),
  FOREIGN KEY ("AssignedByUserID") REFERENCES "User"("UserID")
);

CREATE TABLE "User" (
  "UserID" TEXT NOT NULL PRIMARY KEY,
  "Username" TEXT NOT NULL UNIQUE,
  "Email" TEXT UNIQUE,
  "Password" TEXT NOT NULL,
  "Role" TEXT NOT NULL DEFAULT 'VIEWER',
  "ResetCode" TEXT,
  "ResetCodeExpiry" TIMESTAMP(3),
  "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "UpdatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "AssetType" (
  "TypeID" TEXT NOT NULL PRIMARY KEY,
  "Name" TEXT NOT NULL UNIQUE,
  "OwnershipType" TEXT NOT NULL DEFAULT 'Individual',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Department" (
  "departmentid" UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" TEXT NOT NULL,
  "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AssetRequest" (
  "RequestID" TEXT NOT NULL PRIMARY KEY,
  "FirstName" TEXT NOT NULL,
  "LastName" TEXT NOT NULL,
  "Email" TEXT NOT NULL,
  "RequestType" TEXT NOT NULL,
  "RequestedDate" TIMESTAMP(3) NOT NULL,
  "Notes" TEXT,
  "Status" TEXT NOT NULL DEFAULT 'Pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Manufacturer" (
  "ManufacturerID" TEXT NOT NULL PRIMARY KEY,
  "Name" TEXT NOT NULL UNIQUE,
  "Website" TEXT,
  "SupportEmail" TEXT,
  "SupportPhone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "AssetModel" (
  "ModelID" TEXT NOT NULL PRIMARY KEY,
  "Name" TEXT NOT NULL,
  "ModelNumber" TEXT,
  "Category" TEXT NOT NULL,
  "ManufacturerID" TEXT NOT NULL,
  "Description" TEXT,
  "ImageURL" TEXT,
  "EOLDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("ManufacturerID") REFERENCES "Manufacturer"("ManufacturerID")
);

CREATE TABLE "ModelRelationship" (
  "RelationshipID" TEXT NOT NULL PRIMARY KEY,
  "ParentModelID" TEXT NOT NULL,
  "ChildModelID" TEXT NOT NULL,
  "Type" TEXT NOT NULL,
  UNIQUE("ParentModelID", "ChildModelID", "Type"),
  FOREIGN KEY ("ParentModelID") REFERENCES "AssetModel"("ModelID"),
  FOREIGN KEY ("ChildModelID") REFERENCES "AssetModel"("ModelID")
);

CREATE TABLE "Vendor" (
  "VendorID" TEXT NOT NULL PRIMARY KEY,
  "Name" TEXT NOT NULL UNIQUE,
  "ContactName" TEXT,
  "Email" TEXT,
  "Phone" TEXT,
  "Address" TEXT,
  "Website" TEXT,
  "ContractStart" TIMESTAMP(3),
  "ContractEnd" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "ProcurementRequest" (
  "RequestID" TEXT NOT NULL PRIMARY KEY,
  "RequesterUserID" TEXT NOT NULL,
  "Status" TEXT NOT NULL DEFAULT 'PENDING',
  "VendorID" TEXT,
  "CostCenter" TEXT,
  "TotalCost" DECIMAL,
  "Currency" TEXT NOT NULL DEFAULT 'USD',
  "Notes" TEXT,
  "OrderDate" TIMESTAMP(3),
  "ExpectedDate" TIMESTAMP(3),
  "ReceivedDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("VendorID") REFERENCES "Vendor"("VendorID")
);

CREATE TABLE "ProcurementItem" (
  "ItemID" TEXT NOT NULL PRIMARY KEY,
  "RequestID" TEXT NOT NULL,
  "ModelID" TEXT NOT NULL,
  "Quantity" INTEGER NOT NULL,
  "UnitPrice" DECIMAL,
  FOREIGN KEY ("RequestID") REFERENCES "ProcurementRequest"("RequestID")
);
