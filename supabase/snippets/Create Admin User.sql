INSERT INTO "public"."User" ("UserID", "Username", "Password", "Role", "Email", "UpdatedAt")
VALUES (
  gen_random_uuid()::text,
  'admin',
  '$2b$10$2..6u6K/Fx/59wZzTi5f.O0ekwj3iGPPhI3aZVkymGi9zqAHXv88O',
  'ADMIN',
  'mahan.zartoshti@gmail.com',
  now()
);
