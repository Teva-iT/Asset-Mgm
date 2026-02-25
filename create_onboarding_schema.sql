CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Onboarding Requests Table (Parent Orchestrator)
CREATE TABLE public.onboarding_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    requested_by VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    include_access BOOLEAN NOT NULL DEFAULT false,
    include_hardware BOOLEAN NOT NULL DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Modify Access Requests Table (Make it a possible child)
ALTER TABLE public.access_requests
ADD COLUMN onboarding_request_id UUID NULL REFERENCES public.onboarding_requests(id) ON DELETE SET NULL;

-- 3. Create Hardware Requests Table (Child of Onboarding)
CREATE TABLE public.hardware_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    onboarding_request_id UUID NULL REFERENCES public.onboarding_requests(id) ON DELETE SET NULL,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    requested_by VARCHAR(255) NOT NULL,
    request_type VARCHAR(50) NOT NULL DEFAULT 'Standard', -- Standard / Additional
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Hardware Standard Items (Fixed list context)
CREATE TABLE public.hardware_standard_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hardware_request_id UUID NOT NULL REFERENCES public.hardware_requests(id) ON DELETE CASCADE,
    item_category VARCHAR(100) NOT NULL, -- e.g. "Laptop", "Monitor", "Peripherals"
    item_name VARCHAR(255) NOT NULL, -- e.g. "Standard Notebook", "27 Inch Display"
    is_requested BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create Hardware Additional Items (Dynamic justification context)
CREATE TABLE public.hardware_additional_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hardware_request_id UUID NOT NULL REFERENCES public.hardware_requests(id) ON DELETE CASCADE,
    item_description TEXT NOT NULL,
    business_justification TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS Policies (Assuming authenticated users can CRUD for now, mirroring access_requests)
ALTER TABLE public.onboarding_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to authenticated users on onboarding_requests" ON public.onboarding_requests FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.hardware_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to authenticated users on hardware_requests" ON public.hardware_requests FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.hardware_standard_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to authenticated users on hardware_standard_items" ON public.hardware_standard_items FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE public.hardware_additional_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to authenticated users on hardware_additional_items" ON public.hardware_additional_items FOR ALL USING (auth.role() = 'authenticated');
