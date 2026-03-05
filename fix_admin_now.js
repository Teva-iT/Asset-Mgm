require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const fs = require('fs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

let logs = "";
function log(msg) {
    logs += msg + "\n";
    fs.writeFileSync('admin_result.txt', logs);
}

async function checkAdmin() {
    try {
        log("Checking for admin user...");
        const { data: user, error } = await supabase.from('User').select('*').ilike('Username', 'admin').maybeSingle();

        if (error) {
            log("Error querying user: " + error.message);
            process.exit(1);
        }

        const newHash = await bcrypt.hash("2244", 10)

        if (!user) {
            log("No admin user found. Creating admin...");
            const { error: insErr } = await supabase.from('User').insert({
                UserID: crypto.randomUUID(),
                Username: 'admin',
                Email: 'admin@teva',
                Password: newHash,
                Role: 'Admin',
                CreatedAt: new Date().toISOString(),
                UpdatedAt: new Date().toISOString()
            });
            if (insErr) {
                log("Failed to insert admin: " + insErr.message);
            } else {
                log("Admin account successfully created with password 2244");
            }
        } else {
            log("Admin config found. Resetting password...");
            const { error: updErr } = await supabase.from('User').update({ Password: newHash }).eq('UserID', user.UserID);
            if (updErr) {
                log("Failed to update admin: " + updErr.message);
            } else {
                log("Admin password successfully reset to 2244");
            }
        }
    } catch (e) {
        log("Exception: " + e.message);
    }
    process.exit(0);
}
checkAdmin();
