require('dotenv').config()
const http = require('http')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY is missing")
    process.exit(1)
}

const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20260306220800_update_inventory_record_fk.sql')
const sql = fs.readFileSync(migrationPath, 'utf8')

const sqlPayload = JSON.stringify({ query: sql })
const urlObj = new URL(supabaseUrl)

const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
    path: '/rest/v1/rpc/exec_raw_sql',
    method: 'POST',
    headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(sqlPayload)
    }
}

console.log(`Applying migration via HTTP to ${options.hostname}:${options.port}${options.path}`)

const req = http.request(options, (res) => {
    let data = ''
    res.on('data', chunk => data += chunk)
    res.on('end', () => {
        console.log("Response Status:", res.statusCode)
        console.log("Response Data:", data)
        if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log("Migration applied successfully.")
            process.exit(0)
        } else {
            console.error("Migration failed.")
            process.exit(1)
        }
    })
})

req.on('error', (err) => {
    console.error("Error:", err.message)
    process.exit(1)
})

req.write(sqlPayload)
req.end()
