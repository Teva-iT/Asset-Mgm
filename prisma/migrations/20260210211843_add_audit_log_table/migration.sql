/*
  Warnings:

  - You are about to drop the `Department` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[SerialNumber]` on the table `Asset` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[AssetTag]` on the table `Asset` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[DeviceTag]` on the table `Asset` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[Email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "AssetTag" TEXT,
ADD COLUMN     "ModelID" TEXT,
ADD COLUMN     "ProcurementItemID" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "Email" TEXT,
ADD COLUMN     "ResetCode" TEXT,
ADD COLUMN     "ResetCodeExpiry" TIMESTAMP(3);

-- DropTable
DROP TABLE "Department";

-- CreateTable
CREATE TABLE "department" (
    "departmentid" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_pkey" PRIMARY KEY ("departmentid")
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
CREATE TABLE "_ModelVendors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Manufacturer_Name_key" ON "Manufacturer"("Name");

-- CreateIndex
CREATE UNIQUE INDEX "ModelRelationship_ParentModelID_ChildModelID_Type_key" ON "ModelRelationship"("ParentModelID", "ChildModelID", "Type");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_Name_key" ON "Vendor"("Name");

-- CreateIndex
CREATE UNIQUE INDEX "_ModelVendors_AB_unique" ON "_ModelVendors"("A", "B");

-- CreateIndex
CREATE INDEX "_ModelVendors_B_index" ON "_ModelVendors"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_SerialNumber_key" ON "Asset"("SerialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_AssetTag_key" ON "Asset"("AssetTag");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_DeviceTag_key" ON "Asset"("DeviceTag");

-- CreateIndex
CREATE UNIQUE INDEX "User_Email_key" ON "User"("Email");

-- AddForeignKey
ALTER TABLE "AssetModel" ADD CONSTRAINT "AssetModel_ManufacturerID_fkey" FOREIGN KEY ("ManufacturerID") REFERENCES "Manufacturer"("ManufacturerID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelRelationship" ADD CONSTRAINT "ModelRelationship_ParentModelID_fkey" FOREIGN KEY ("ParentModelID") REFERENCES "AssetModel"("ModelID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelRelationship" ADD CONSTRAINT "ModelRelationship_ChildModelID_fkey" FOREIGN KEY ("ChildModelID") REFERENCES "AssetModel"("ModelID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementRequest" ADD CONSTRAINT "ProcurementRequest_VendorID_fkey" FOREIGN KEY ("VendorID") REFERENCES "Vendor"("VendorID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcurementItem" ADD CONSTRAINT "ProcurementItem_RequestID_fkey" FOREIGN KEY ("RequestID") REFERENCES "ProcurementRequest"("RequestID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_ModelID_fkey" FOREIGN KEY ("ModelID") REFERENCES "AssetModel"("ModelID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_ProcurementItemID_fkey" FOREIGN KEY ("ProcurementItemID") REFERENCES "ProcurementItem"("ItemID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_AssetID_fkey" FOREIGN KEY ("AssetID") REFERENCES "Asset"("AssetID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModelVendors" ADD CONSTRAINT "_ModelVendors_A_fkey" FOREIGN KEY ("A") REFERENCES "AssetModel"("ModelID") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModelVendors" ADD CONSTRAINT "_ModelVendors_B_fkey" FOREIGN KEY ("B") REFERENCES "Vendor"("VendorID") ON DELETE CASCADE ON UPDATE CASCADE;
