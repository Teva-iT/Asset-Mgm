require('dotenv').config()
const http = require('http')

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const sql = "SELECT sync_inventory_alerts();"
const sqlPayload = JSON.stringify({ query: sql })

const req = http.request({
    hostname: '127.0.0.1',
    port: 54321,
    path: '/rest/v1/rpc/exec_raw_sql',
    method: 'POST',
    headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(sqlPayload)
    }
}, (res) => {
    let data = ''
    res.on('data', chunk => data += chunk)
    res.on('end', () => {
        console.log('Sync result:', data)
        process.exit(0)
    })
})

req.on('error', (err) => {
    console.error('Error:', err.message)
    process.exit(1)
})

req.write(sqlPayload)
req.end()
