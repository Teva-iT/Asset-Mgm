-- Ensure a valid test user exists for the dashboard
INSERT INTO "User" ("UserID", "Username", "Role", "Password", "updatedAt")
VALUES ('admin-user', 'Dashboard Admin', 'ADMIN', '123456', now())
ON CONFLICT ("UserID") DO NOTHING;

-- Ensure settings exist for this user
INSERT INTO "InventoryNotificationSetting" ("UserID", "EmailEnabled", "SystemEnabled", "AlertFrequency")
VALUES ('admin-user', true, true, 'Daily')
ON CONFLICT ("UserID") DO NOTHING;
