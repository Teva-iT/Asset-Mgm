require('dotenv').config()
const http = require('http')

const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const sql = "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';"
const sqlPayload = JSON.stringify({ query: sql })

const options = {
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
}

const req = http.request(options, (res) => {
    let data = ''
    res.on('data', chunk => data += chunk)
    res.on('end', () => {
        try {
            const result = JSON.parse(data)
            console.log('Tables found in database:')
            console.log(result.map(r => r.tablename).filter(t => ['InventoryAlertRule', 'InventoryNotificationSetting', 'InventoryAlert', 'AssetModel'].includes(t)))
        } catch (e) {
            console.log('Raw result:', data)
        }
        process.exit(0)
    })
})

req.on('error', (err) => {
    console.error('API Error:', err.message)
    process.exit(1)
})

req.write(sqlPayload)
req.end()
