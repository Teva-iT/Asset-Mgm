require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
const fs = require('fs')

function log(msg) {
    fs.appendFileSync('admin_log.txt', msg + '\n');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

log("URL: " + supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAdmin() {
    log("Connecting to Supabase at " + supabaseUrl);

    try {
        const { data: user, error } = await supabase
            .from('User')
            .select('*')
            .ilike('Username', 'admin')
            .maybeSingle();

        if (error) {
            log("Error fetching admin: " + error.message)
            return
        }

        if (!user) {
            log("Admin user does not exist in the database.")
            return
        }

        log("Admin exists. Username: " + user.Username + " | Role: " + user.Role);

        const isValid = await bcrypt.compare("2244", user.Password)
        log("Does '2244' match stored hash? " + isValid);

        if (!isValid) {
            log("Creating new hash and updating admin...");
            const newHash = await bcrypt.hash("2244", 10)

            const { error: updateError } = await supabase
                .from('User')
                .update({ Password: newHash })
                .eq('UserID', user.UserID);

            if (updateError) {
                log("Failed to update password: " + updateError.message);
            } else {
                log("Password updated successfully to '2244'!");
            }
        } else {
            log("Password is correct. Login issue might be something else.");
        }
    } catch (err) {
        log("Unexpected Error: " + err.message);
    }
}

checkAdmin()
