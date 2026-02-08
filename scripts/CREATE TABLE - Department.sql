-- 1. Create the table
CREATE TABLE "Department" (
    "DepartmentID" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("DepartmentID")
);

-- 2. Create a unique index on Name
CREATE UNIQUE INDEX "Department_Name_key" ON "Department"("Name");

-- 3. Insert Default Departments
INSERT INTO "Department" ("DepartmentID", "Name", "updatedAt") VALUES
('uuid-1', 'IT', NOW()),
('uuid-2', 'HR', NOW()),
('uuid-3', 'Sales', NOW()),
('uuid-4', 'Engineering', NOW()),
('uuid-5', 'Marketing', NOW()),
('uuid-6', 'Operations', NOW()),
('uuid-7', 'Finance', NOW()),
('uuid-8', 'QA', NOW()),
('uuid-9', 'Facility', NOW()),
('uuid-10', 'Management', NOW());