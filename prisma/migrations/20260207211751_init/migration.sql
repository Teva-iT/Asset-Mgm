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

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("AssignmentID")
);

-- CreateTable
CREATE TABLE "User" (
    "UserID" TEXT NOT NULL,
    "Username" TEXT NOT NULL,
    "Password" TEXT NOT NULL,
    "Role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("UserID")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_SerialNumber_key" ON "Asset"("SerialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_Email_key" ON "Employee"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "User_Username_key" ON "User"("Username");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_AssetID_fkey" FOREIGN KEY ("AssetID") REFERENCES "Asset"("AssetID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_EmployeeID_fkey" FOREIGN KEY ("EmployeeID") REFERENCES "Employee"("EmployeeID") ON DELETE RESTRICT ON UPDATE CASCADE;
