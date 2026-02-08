INSERT INTO public."User" (
  "UserID",
  "Username",
  "Password",
  "Role",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'Mahan',
  '2244',
  'Admin',
  NOW(),
  NOW()
);
