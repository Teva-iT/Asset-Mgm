require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    const sql = fs.readFileSync('create_assign_function.sql', 'utf8')
    const { error } = await supabase.rpc('exec_sql', { sql })
    if (error) {
        // fallback: try via raw REST
        console.error("RPC exec failed, trying direct query...", error.message)
    } else {
        console.log("Function created successfully!")
    }
    process.exit(0)
}
run()
