-- Point 3: Add JSONB result column to ad_sync_logs for per-group outcome detail
ALTER TABLE public.ad_sync_logs
  ADD COLUMN IF NOT EXISTS result JSONB;

-- Point 4: Tighten RLS — only ADMIN role users should read audit logs
-- Drop the permissive policy first
DROP POLICY IF EXISTS "Allow IT to read AD provisioning logs" ON public.ad_provisioning_logs;
DROP POLICY IF EXISTS "Allow admins to read ad_sync_logs" ON public.ad_sync_logs;

-- Recreate with stricter check — for now using service role key in API,
-- but this prevents direct DB access by non-admin browser clients
CREATE POLICY "read_ad_sync_logs_admin_only"
  ON public.ad_sync_logs FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "insert_ad_sync_logs_service"
  ON public.ad_sync_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');


-- Migration 4: Result JSONB + Tighter RLS
ALTER TABLE public.ad_sync_logs
  ADD COLUMN IF NOT EXISTS result JSONB;

DROP POLICY IF EXISTS "Allow admins to read ad_sync_logs" ON public.ad_sync_logs;
DROP POLICY IF EXISTS "Allow system to insert ad_sync_logs" ON public.ad_sync_logs;

CREATE POLICY "read_ad_sync_logs_admin_only"
  ON public.ad_sync_logs FOR SELECT
  USING (auth.role() = 'service_role');
CREATE POLICY "insert_ad_sync_logs_service"
  ON public.ad_sync_logs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
