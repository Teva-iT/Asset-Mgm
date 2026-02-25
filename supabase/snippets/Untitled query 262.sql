-- 1. ad_sync_logs table
CREATE TABLE IF NOT EXISTS public.ad_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  executed_by TEXT REFERENCES public."User"("UserID") ON DELETE SET NULL,
  executor_name TEXT,
  from_user TEXT NOT NULL,
  to_user TEXT NOT NULL,
  to_user_dn TEXT NOT NULL,
  groups_added TEXT[] NOT NULL DEFAULT '{}',
  groups_removed TEXT[] NOT NULL DEFAULT '{}',
  groups_failed TEXT[] NOT NULL DEFAULT '{}',
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.ad_sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert" ON public.ad_sync_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "read"   ON public.ad_sync_logs FOR SELECT USING (true);
