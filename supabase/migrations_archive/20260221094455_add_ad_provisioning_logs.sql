-- Create AD Provisioning Logs Table
CREATE TABLE IF NOT EXISTS public.ad_provisioning_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_dn TEXT NOT NULL,
    group_dn TEXT NOT NULL,
    executor_id TEXT NULL REFERENCES public."User"("UserID") ON DELETE SET NULL, -- Tie back to IT admin
    access_request_id UUID NULL REFERENCES public.access_requests(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL DEFAULT 'ADD_MEMBER',
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS Policies
ALTER TABLE public.ad_provisioning_logs ENABLE ROW LEVEL SECURITY;

-- IT Admins should be able to read logs
CREATE POLICY "Allow IT to read AD provisioning logs" 
ON public.ad_provisioning_logs 
FOR SELECT 
USING (true); -- Mirroring public for now, should restrict to authenticated ADMIN/IT roles in production.

-- Only system/authenticated users should insert logs
CREATE POLICY "Allow authenticated to insert AD provisioning logs" 
ON public.ad_provisioning_logs 
FOR INSERT 
WITH CHECK (true);
