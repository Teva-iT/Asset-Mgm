
-- CreateTable
CREATE TABLE "Employee" (
    "EmployeeID" TEXT NOT NULL,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Slug" TEXT,
    "Department" TEXT NOT NULL,
    "StartDate" TIMESTAMP(3) NOT NULL,
    "EndDate" TIMESTAMP(3),
    "Status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("EmployeeID")
);