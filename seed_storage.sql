-- Seed Storage Locations
INSERT INTO "StorageLocation" ("LocationID", "Name", "Description", "updatedAt") VALUES
('loc-001', 'Head Office', 'Main HQ', NOW()),
('loc-002', 'Warehouse A', 'Main storage facility', NOW()),
('loc-003', 'Server Room', 'Primary Data Center', NOW());

-- Sub-locations
INSERT INTO "StorageLocation" ("LocationID", "Name", "Description", "ParentLocationID", "updatedAt") VALUES
('loc-sub-001', 'IT Cupboard', 'For laptops', 'loc-001', NOW()),
('loc-sub-002', 'Shelf B1', 'Components', 'loc-002', NOW());
