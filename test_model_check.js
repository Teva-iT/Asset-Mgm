const fs = require('fs');
require('dotenv').config();
const c = require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data, error } = await c.from('AssetModel').select('*');
    fs.writeFileSync('db_models_dump.json', JSON.stringify({ data, error }, null, 2));
}

run();
