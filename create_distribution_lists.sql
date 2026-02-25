CREATE TABLE IF NOT EXISTS public.distribution_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed initial data
INSERT INTO public.distribution_lists (name) VALUES
    ('TevaChAes-Mepha Schweiz AG Innendienst'),
    ('TevaChAes-Mepha Schweiz AG Aussendienst'),
    ('TevaChAes-Corporate Communications'),
    ('TevaChAes-Finance_IT'),
    ('TevaChAes-General Management'),
    ('TevaChAes-HR'),
    ('TevaChAes-Legal'),
    ('TevaChAes-Marketing'),
    ('TevaChAes-Marketing Info'),
    ('TevaChAes-Medical'),
    ('TevaChAes-Pharma Affairs'),
    ('TevaChAes-PVG'),
    ('TevaChAes-QA'),
    ('TevaChAes-RA'),
    ('TevaChAes-Sales Innendienst'),
    ('TevaChAes-Supply Chain')
ON CONFLICT DO NOTHING;
