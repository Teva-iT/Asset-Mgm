-- Insert Default Asset Types
INSERT INTO "AssetType" ("TypeID", "Name", "updatedAt") VALUES
(gen_random_uuid(), 'Laptop', NOW()),
(gen_random_uuid(), 'Desktop', NOW()),
(gen_random_uuid(), 'Monitor', NOW()),
(gen_random_uuid(), 'Keyboard', NOW()),
(gen_random_uuid(), 'Mouse', NOW()),
(gen_random_uuid(), 'Printer', NOW()),
(gen_random_uuid(), 'Scanner', NOW()),
(gen_random_uuid(), 'Headset', NOW()),
(gen_random_uuid(), 'Webcam', NOW()),
(gen_random_uuid(), 'Speaker', NOW()),
(gen_random_uuid(), 'Docking Station', NOW()),
(gen_random_uuid(), 'Mobile', NOW()),
(gen_random_uuid(), 'Tablet', NOW()),
(gen_random_uuid(), 'iPhone Charger', NOW()),
(gen_random_uuid(), 'iPhone Headset', NOW()),
(gen_random_uuid(), 'Power Bank', NOW()),
(gen_random_uuid(), 'Adapter', NOW()),
(gen_random_uuid(), 'Cable', NOW()),
(gen_random_uuid(), 'Server', NOW()),
(gen_random_uuid(), 'Router', NOW()),
(gen_random_uuid(), 'Switch', NOW()),
(gen_random_uuid(), 'Projector', NOW()),
(gen_random_uuid(), 'TV', NOW()),
(gen_random_uuid(), 'Furniture', NOW()),
(gen_random_uuid(), 'Other', NOW())
ON CONFLICT ("Name") DO NOTHING;

-- Insert First Admin User (Optional)
-- Password is 'admin123' (hashed) if you need one, but usually this is handled by signup.
-- INSERT INTO "User" ("UserID", "Username", "Password", "Role", "updatedAt") VALUES
-- (gen_random_uuid(), 'admin', '$2a$10$YourHashedPasswordHere', 'ADMIN', NOW());
