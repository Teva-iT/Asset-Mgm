-- CreateTable
CREATE TABLE "Asset" (
    "AssetID" TEXT NOT NULL,
    "AssetType" TEXT NOT NULL,
    "AssetName" TEXT NOT NULL,
    "Brand" TEXT NOT NULL,
    "Model" TEXT NOT NULL,
    "SerialNumber" TEXT NOT NULL,
    "DeviceTag" TEXT,
    "Status" TEXT NOT NULL,
    "PurchaseDate" TIMESTAMP(3) NOT NULL,
    "Notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("AssetID")
);