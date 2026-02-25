require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const { data, error } = await supabase.rpc('exec_sql', {
        query: 'ALTER TABLE "AssetModel" ADD COLUMN IF NOT EXISTS "Series" TEXT;'
    });

    if (error) {
        console.log('RPC failed (expected), trying direct query...');
        // Try raw fetch to the admin API
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
            method: 'OPTIONS'
        });
        console.log('API status:', res.status);
    } else {
        console.log('Column added successfully:', data);
    }
}

main().catch(console.error);
