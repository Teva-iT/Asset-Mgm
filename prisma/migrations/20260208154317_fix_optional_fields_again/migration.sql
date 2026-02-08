/*
  Warnings:

  - A unique constraint covering the columns `[Slug]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Asset" ALTER COLUMN "AssetType" DROP NOT NULL,
ALTER COLUMN "AssetName" DROP NOT NULL,
ALTER COLUMN "Brand" DROP NOT NULL,
ALTER COLUMN "Model" DROP NOT NULL,
ALTER COLUMN "SerialNumber" DROP NOT NULL,
ALTER COLUMN "Status" DROP NOT NULL,
ALTER COLUMN "PurchaseDate" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "AssignedByUserID" TEXT;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "Slug" TEXT;

-- CreateTable
CREATE TABLE "AssetType" (
    "TypeID" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetType_pkey" PRIMARY KEY ("TypeID")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssetType_Name_key" ON "AssetType"("Name");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_Slug_key" ON "Employee"("Slug");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_AssignedByUserID_fkey" FOREIGN KEY ("AssignedByUserID") REFERENCES "User"("UserID") ON DELETE SET NULL ON UPDATE CASCADE;
