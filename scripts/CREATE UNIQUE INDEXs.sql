
-- CreateIndex
CREATE UNIQUE INDEX "Asset_SerialNumber_key" ON "Asset"("SerialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_Email_key" ON "Employee"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_Slug_key" ON "Employee"("Slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_Username_key" ON "User"("Username");

-- CreateIndex
CREATE UNIQUE INDEX "AssetType_Name_key" ON "AssetType"("Name");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_AssetID_fkey" FOREIGN KEY ("AssetID") REFERENCES "Asset"("AssetID") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_EmployeeID_fkey" FOREIGN KEY ("EmployeeID") REFERENCES "Employee"("EmployeeID") ON DELETE RESTRICT ON UPDATE CASCADE;
