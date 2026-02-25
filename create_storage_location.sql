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

-- AddForeignKey
ALTER TABLE "StorageLocation" ADD CONSTRAINT "StorageLocation_ParentLocationID_fkey" FOREIGN KEY ("ParentLocationID") REFERENCES "StorageLocation"("LocationID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddColumn to Asset
ALTER TABLE "Asset" ADD COLUMN "StorageLocationID" TEXT;

-- AddForeignKey for Asset
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_StorageLocationID_fkey" FOREIGN KEY ("StorageLocationID") REFERENCES "StorageLocation"("LocationID") ON DELETE SET NULL ON UPDATE CASCADE;
