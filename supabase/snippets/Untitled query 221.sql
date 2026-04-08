-- 4. NOTIFICATION SETTINGS
CREATE TABLE IF NOT EXISTS "InventoryNotificationSetting" (
  "SettingID" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "UserID" TEXT NOT NULL REFERENCES "User"("UserID") ON DELETE CASCADE,
  "EmailEnabled" BOOLEAN DEFAULT true,
  "SystemEnabled" BOOLEAN DEFAULT true,
  "AlertFrequency" TEXT DEFAULT 'Once', 
  "Recipients" TEXT, 
  "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE("UserID")
);