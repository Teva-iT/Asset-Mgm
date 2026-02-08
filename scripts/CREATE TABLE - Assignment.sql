
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

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("AssignmentID")
);
