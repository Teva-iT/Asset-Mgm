-- CreateEnum is not needed as we use String, but if you want consistency:
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