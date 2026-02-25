CREATE TABLE IF NOT EXISTS public.ad_sync_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  executed_by TEXT REFERENCES "User"("UserID"),
  from_user   TEXT NOT NULL,   -- reference username
  to_user     TEXT NOT NULL,   -- target username
  to_user_dn  TEXT NOT NULL,
  groups_added TEXT[] NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
