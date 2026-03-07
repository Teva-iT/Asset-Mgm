-- Ensure the admin-user and mahan exist in the database with the correct password
-- This prevents any foreign key or auth mismatches during persistence.
INSERT INTO "User" ("UserID", "Username", "Role", "Password", "updatedAt")
VALUES 
('admin-user', 'Admin', 'ADMIN', '2244', now()),
('mahan', 'Mahan', 'ADMIN', '2244', now())
ON CONFLICT ("UserID") DO UPDATE SET "Password" = EXCLUDED."Password";

-- Clear any old settings that might be corrupted or cause conflict
DELETE FROM "InventoryNotificationSetting" WHERE "UserID" = 'mahan';

-- Create fresh operational base for mahan
INSERT INTO "InventoryNotificationSetting" ("UserID", "EmailEnabled", "SystemEnabled", "AlertFrequency", "Recipients")
VALUES ('mahan', true, true, 'Daily', 'mahan.zartoshti@gmail.com');
