-- Advanced Supply Chain Schema Updates

ALTER TABLE "InventoryAlertRule" 
ADD COLUMN IF NOT EXISTS "PredictiveThresholdDays" INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS "LeadTimeDays" INTEGER DEFAULT 3; -- Default lead time factor for recommendations
