-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "ScanHistory" (
    "ScanID" TEXT NOT NULL,
    "ScannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "Outcome" TEXT NOT NULL,
    "Method" TEXT NOT NULL,
    "Query" TEXT,
    "CalculatedStatus" TEXT,
    "AssetID" TEXT,
    "ScannedByUserID" TEXT,

    CONSTRAINT "ScanHistory_pkey" PRIMARY KEY ("ScanID")
);

-- CreateTable
CREATE TABLE "AssetPhoto" (
    "PhotoID" TEXT NOT NULL,
    "AssetID" TEXT NOT NULL,
    "URL" TEXT NOT NULL,
    "Category" TEXT NOT NULL DEFAULT 'General',
    "UploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetPhoto_pkey" PRIMARY KEY ("PhotoID")
);

-- CreateTable
CREATE TABLE "Employee" (
    "EmployeeID" TEXT NOT NULL,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Department" TEXT NOT NULL,
    "StartDate" TIMESTAMP(3) NOT NULL,
    "EndDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'Active',
    "Slug" TEXT,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("EmployeeID")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "AssignmentID" TEXT NOT NULL,
    "AssetID" TEXT NOT NULL,
    "EmployeeID" TEXT NOT NULL,
    "AssignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ExpectedReturnDate" TIMESTAMP(3),
    "ActualReturnDate" TIMESTAMP(3),
    "Status" TEXT NOT NULL,
    "Notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "AssignedByUserID" TEXT,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("AssignmentID")
);

-- CreateTable
CREATE TABLE "User" (
    "UserID" TEXT NOT NULL,
    "Username" TEXT NOT NULL,
    "Password" TEXT NOT NULL,
    "Role" TEXT NOT NULL DEFAULT 'VIEWER',
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,
    "Email" TEXT,
    "ResetCode" TEXT,
    "ResetCodeExpiry" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("UserID")
);

-- CreateTable
CREATE TABLE "AssetType" (
    "TypeID" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "OwnershipType" TEXT NOT NULL DEFAULT 'Individual',

    CONSTRAINT "AssetType_pkey" PRIMARY KEY ("TypeID")
);

-- CreateTable
CREATE TABLE "department" (
    "departmentid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_pkey" PRIMARY KEY ("departmentid")
);

-- CreateTable
CREATE TABLE "AssetRequest" (
    "RequestID" TEXT NOT NULL,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "RequestType" TEXT NOT NULL,
    "RequestedDate" TIMESTAMP(3) NOT NULL,
    "Notes" TEXT,
    "Status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetRequest_pkey" PRIMARY KEY ("RequestID")
);

-- CreateTable
CREATE TABLE "Manufacturer" (
    "ManufacturerID" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Website" TEXT,
    "SupportEmail" TEXT,
    "SupportPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Manufacturer_pkey" PRIMARY KEY ("ManufacturerID")
);

-- CreateTable
CREATE TABLE "AssetModel" (
    "ModelID" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "ModelNumber" TEXT,
    "Category" TEXT NOT NULL,
    "ManufacturerID" TEXT NOT NULL,
    "Description" TEXT,
    "ImageURL" TEXT,
    "EOLDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetModel_pkey" PRIMARY KEY ("ModelID")
);

-- CreateTable
CREATE TABLE "ModelRelationship" (
    "RelationshipID" TEXT NOT NULL,
    "ParentModelID" TEXT NOT NULL,
    "ChildModelID" TEXT NOT NULL,
    "Type" TEXT NOT NULL,

    CONSTRAINT "ModelRelationship_pkey" PRIMARY KEY ("RelationshipID")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "VendorID" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "ContactName" TEXT,
    "Email" TEXT,
    "Phone" TEXT,
    "Address" TEXT,
    "Website" TEXT,
    "ContractStart" TIMESTAMP(3),
    "ContractEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("VendorID")
);

-- CreateTable
CREATE TABLE "ProcurementRequest" (
    "RequestID" TEXT NOT NULL,
    "RequesterUserID" TEXT NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'PENDING',
    "VendorID" TEXT,
    "CostCenter" TEXT,
    "TotalCost" DECIMAL(65,30),
    "Currency" TEXT NOT NULL DEFAULT 'USD',
    "Notes" TEXT,
    "OrderDate" TIMESTAMP(3),
    "ExpectedDate" TIMESTAMP(3),
    "ReceivedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcurementRequest_pkey" PRIMARY KEY ("RequestID")
);

-- CreateTable
CREATE TABLE "ProcurementItem" (
    "ItemID" TEXT NOT NULL,
    "RequestID" TEXT NOT NULL,
    "ModelID" TEXT NOT NULL,
    "Quantity" INTEGER NOT NULL,
    "UnitPrice" DECIMAL(65,30),

    CONSTRAINT "ProcurementItem_pkey" PRIMARY KEY ("ItemID")
);

-- CreateTable
CREATE TABLE "Asset" (
    "AssetID" TEXT NOT NULL,
    "AssetType" TEXT,
    "AssetName" TEXT,
    "Brand" TEXT,
    "Model" TEXT,
    "SerialNumber" TEXT,
    "DeviceTag" TEXT,
    "Status" TEXT,
    "PurchaseDate" TIMESTAMP(3),
    "Notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "Condition" TEXT,
    "Location" TEXT,
    "OperationalState" TEXT,
    "OwnershipType" TEXT,
    "Quantity" INTEGER DEFAULT 1,
    "AssetTag" TEXT,
    "ModelID" TEXT,
    "ProcurementItemID" TEXT,
    "StorageLocationID" TEXT,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("AssetID")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "LogID" TEXT NOT NULL,
    "AssetID" TEXT NOT NULL,
    "Action" TEXT NOT NULL,
    "Details" TEXT,
    "UserID" TEXT,
    "Timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("LogID")
);

-- CreateTable
CREATE TABLE "StorageLocation" (
    "LocationID" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "Description" TEXT,
    "ParentLocationID" TEXT,
    "cachedPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageLocation_pkey" PRIMARY KEY ("LocationID")
);

-- CreateTable
CREATE TABLE "OffboardingChecklist" (
    "ChecklistID" TEXT NOT NULL,
    "EmployeeID" TEXT NOT NULL,
    "ExitDate" TIMESTAMP(3) NOT NULL,
    "Status" TEXT NOT NULL DEFAULT 'Draft',
    "Language" TEXT NOT NULL DEFAULT 'DE',
    "CreatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ChecklistData" JSONB,

    CONSTRAINT "OffboardingChecklist_pkey" PRIMARY KEY ("ChecklistID")
);

-- CreateTable
CREATE TABLE "OffboardingToken" (
    "TokenID" TEXT NOT NULL,
    "ChecklistID" TEXT NOT NULL,
    "Token" TEXT NOT NULL,
    "ExpiresAt" TIMESTAMP(3) NOT NULL,
    "Used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OffboardingToken_pkey" PRIMARY KEY ("TokenID")
);

-- CreateTable
CREATE TABLE "OffboardingAudit" (
    "AuditID" TEXT NOT NULL,
    "ChecklistID" TEXT NOT NULL,
    "Action" TEXT NOT NULL,
    "UserID" TEXT,
    "Timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "IPAddress" TEXT,

    CONSTRAINT "OffboardingAudit_pkey" PRIMARY KEY ("AuditID")
);

-- CreateTable
CREATE TABLE "_ModelVendors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ModelVendors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_Email_key" ON "Employee"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_Slug_key" ON "Employee"("Slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_Username_key" ON "User"("Username");

-- CreateIndex
CREATE UNIQUE INDEX "User_Email_key" ON "User"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "AssetType_Name_key" ON "AssetType"("Name");

-- CreateIndex
CREATE UNIQUE INDEX "Manufacturer_Name_key" ON "Manufacturer"("Name");

-- CreateIndex
CREATE UNIQUE INDEX "ModelRelationship_ParentModelID_ChildModelID_Type_key" ON "ModelRelationship"("ParentModelID", "ChildModelID", "Type");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_Name_key" ON "Vendor"("Name");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_SerialNumber_key" ON "Asset"("SerialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_DeviceTag_key" ON "Asset"("DeviceTag");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_AssetTag_key" ON "Asset"("AssetTag");

-- CreateIndex
CREATE UNIQUE INDEX "OffboardingToken_Token_key" ON "OffboardingToken"("Token");

-- CreateIndex
CREATE INDEX "_ModelVendors_B_index" ON "_ModelVendors"("B");

-- AddForeignKey
ALTER TABLE "ScanHistory" ADD CONSTRAINT "ScanHistory_AssetID_fkey" FOREIGN KEY ("AssetID") REFERENCES "Asset"("AssetID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanHistory" ADD CONSTRAINT "ScanHistory_ScannedByUserID_fkey" FOREIGN KEY ("ScannedByUserID") REFERENCES "User"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetPhoto" ADD CONSTRAINT "AssetPhoto_AssetID_fkey" FOREIGN KEY ("AssetID") REFERENCES "Asset"("AssetID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_AssetID_fkey" FOREIGN KEY ("AssetID") REFERENCES "Asset"("AssetID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_AssignedByUserID_fkey" FOREIGN KEY ("AssignedByUserID") REFERENCES "User"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_EmployeeID_fkey" FOREIGN KEY ("EmployeeID") REFERENCES "Employee"("EmployeeID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetModel" ADD CONSTRAINT "AssetModel_ManufacturerID_fkey" FOREIGN KEY ("ManufacturerID") REFERENCES "Manufacturer"("ManufacturerID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelRelationship" ADD CONSTRAINT "ModelRelationship_ChildModelID_fkey" FOREIGN KEY ("ChildModelID") REFERENCES "AssetModel"("ModelID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelRelationship" ADD CONSTRAINT "ModelRelationship_ParentModelID_fkey" FOREIGN KEY ("ParentModelID") REFERENCES "AssetModel"("ModelID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementRequest" ADD CONSTRAINT "ProcurementRequest_VendorID_fkey" FOREIGN KEY ("VendorID") REFERENCES "Vendor"("VendorID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementItem" ADD CONSTRAINT "ProcurementItem_RequestID_fkey" FOREIGN KEY ("RequestID") REFERENCES "ProcurementRequest"("RequestID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_ModelID_fkey" FOREIGN KEY ("ModelID") REFERENCES "AssetModel"("ModelID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_ProcurementItemID_fkey" FOREIGN KEY ("ProcurementItemID") REFERENCES "ProcurementItem"("ItemID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_StorageLocationID_fkey" FOREIGN KEY ("StorageLocationID") REFERENCES "StorageLocation"("LocationID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_AssetID_fkey" FOREIGN KEY ("AssetID") REFERENCES "Asset"("AssetID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageLocation" ADD CONSTRAINT "StorageLocation_ParentLocationID_fkey" FOREIGN KEY ("ParentLocationID") REFERENCES "StorageLocation"("LocationID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffboardingChecklist" ADD CONSTRAINT "OffboardingChecklist_EmployeeID_fkey" FOREIGN KEY ("EmployeeID") REFERENCES "Employee"("EmployeeID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffboardingToken" ADD CONSTRAINT "OffboardingToken_ChecklistID_fkey" FOREIGN KEY ("ChecklistID") REFERENCES "OffboardingChecklist"("ChecklistID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffboardingAudit" ADD CONSTRAINT "OffboardingAudit_ChecklistID_fkey" FOREIGN KEY ("ChecklistID") REFERENCES "OffboardingChecklist"("ChecklistID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffboardingAudit" ADD CONSTRAINT "OffboardingAudit_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModelVendors" ADD CONSTRAINT "_ModelVendors_A_fkey" FOREIGN KEY ("A") REFERENCES "AssetModel"("ModelID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModelVendors" ADD CONSTRAINT "_ModelVendors_B_fkey" FOREIGN KEY ("B") REFERENCES "Vendor"("VendorID") ON DELETE CASCADE ON UPDATE CASCADE;

