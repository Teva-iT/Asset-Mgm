-- Add Support Related Fields to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "AvatarUrl" TEXT,
ADD COLUMN IF NOT EXISTS "SupportRole" TEXT,
ADD COLUMN IF NOT EXISTS "IsSupportContact" BOOLEAN DEFAULT false;
