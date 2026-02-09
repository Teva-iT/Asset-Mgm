/*
  Warnings:

  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - Added the required column `UpdatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Asset_SerialNumber_key";

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "Condition" TEXT,
ADD COLUMN     "Location" TEXT,
ADD COLUMN     "OperationalState" TEXT,
ADD COLUMN     "OwnershipType" TEXT,
ADD COLUMN     "Quantity" INTEGER DEFAULT 1;

-- AlterTable
ALTER TABLE "AssetType" ADD COLUMN     "OwnershipType" TEXT NOT NULL DEFAULT 'Individual';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "UpdatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "Role" SET DEFAULT 'VIEWER';

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
CREATE TABLE "Department" (
    "DepartmentID" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("DepartmentID")
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

-- CreateIndex
CREATE UNIQUE INDEX "Department_Name_key" ON "Department"("Name");

-- AddForeignKey
ALTER TABLE "ScanHistory" ADD CONSTRAINT "ScanHistory_AssetID_fkey" FOREIGN KEY ("AssetID") REFERENCES "Asset"("AssetID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanHistory" ADD CONSTRAINT "ScanHistory_ScannedByUserID_fkey" FOREIGN KEY ("ScannedByUserID") REFERENCES "User"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;
