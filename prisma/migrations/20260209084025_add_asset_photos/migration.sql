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

-- AddForeignKey
ALTER TABLE "AssetPhoto" ADD CONSTRAINT "AssetPhoto_AssetID_fkey" FOREIGN KEY ("AssetID") REFERENCES "Asset"("AssetID") ON DELETE RESTRICT ON UPDATE CASCADE;
