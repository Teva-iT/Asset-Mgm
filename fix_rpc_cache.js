require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321', process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fix() {
    try {
        console.log('1. Re-applying SQL...');
        const sql = `
            CREATE OR REPLACE FUNCTION sync_inventory_alerts()
            RETURNS void
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
                UPDATE "AssetModel" SET "AvailableStock" = "AvailableStock" WHERE true;
            END;
            $$;
            
            NOTIFY pgrst, 'reload schema';
        `;
        const { error } = await s.rpc('exec_raw_sql', { query: sql });
        if (error) throw error;
        console.log('SQL applied and cache reload notified.');

        console.log('2. Verifying function existence...');
        const { data, error: verifyError } = await s.rpc('exec_raw_sql', {
            query: "SELECT routine_name FROM information_schema.routines WHERE routine_name = 'sync_inventory_alerts';"
        });
        if (verifyError) throw verifyError;
        console.log('Verification result:', data);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

fix();
