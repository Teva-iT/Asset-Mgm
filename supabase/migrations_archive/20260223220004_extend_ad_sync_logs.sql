-- Add groups_removed column and executor display name to ad_sync_logs
ALTER TABLE public.ad_sync_logs
  ADD COLUMN IF NOT EXISTS groups_removed TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS groups_failed   TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS executor_name  TEXT;
