-- CreateTable
CREATE TABLE "AssetStatus" (
    "Name" TEXT NOT NULL,
    "Color" TEXT,
    "Description" TEXT,

    CONSTRAINT "AssetStatus_pkey" PRIMARY KEY ("Name")
);

-- Seed Data
INSERT INTO "AssetStatus" ("Name", "Color", "Description") VALUES 
('Available', '#059669', 'Asset is ready to be assigned'),
('Assigned', '#2563eb', 'Asset is currently assigned to an employee'),
('Returned', '#4f46e5', 'Asset is returned and pending inspection'),
('Lost', '#dc2626', 'Asset is confirmed lost'),
('Damaged', '#ef4444', 'Asset is damaged and needs repair'),
('In Stock', '#f59e0b', 'Asset is in storage'),
('Low Stock', '#d97706', 'Warning level for consumables'),
('Retired', '#6b7280', 'Asset is no longer in use');

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_Status_fkey" FOREIGN KEY ("Status") REFERENCES "AssetStatus"("Name") ON DELETE SET NULL ON UPDATE CASCADE;
