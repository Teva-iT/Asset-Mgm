-- AD Sync Logs: records each batch sync operation
CREATE TABLE IF NOT EXISTS public.ad_sync_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  executed_by  TEXT REFERENCES public."User"("UserID") ON DELETE SET NULL,
  from_user    TEXT NOT NULL,
  to_user      TEXT NOT NULL,
  to_user_dn   TEXT NOT NULL,
  groups_added TEXT[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ad_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to read ad_sync_logs"
  ON public.ad_sync_logs FOR SELECT USING (true);

CREATE POLICY "Allow system to insert ad_sync_logs"
  ON public.ad_sync_logs FOR INSERT WITH CHECK (true);
