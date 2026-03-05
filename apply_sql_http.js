require('dotenv').config()
const https = require('https')
const http = require('http')
const fs = require('fs')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const sql = fs.readFileSync('create_assign_function.sql', 'utf8')

const payload = JSON.stringify({ query: sql })
const urlObj = new URL(supabaseUrl + '/rest/v1/rpc/exec_sql')

const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
    path: '/rest/v1/',
    method: 'POST',
    headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
}

// Use Supabase REST SQL endpoint
const sqlPayload = JSON.stringify({ query: sql })
const sqlPath = '/rest/v1/rpc/exec_raw_sql'

const req = http.request({
    hostname: '127.0.0.1',
    port: 54321,
    path: sqlPath,
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
        fs.writeFileSync('sql_apply_result.txt', data)
        process.exit(0)
    })
})
req.on('error', (err) => {
    fs.writeFileSync('sql_apply_result.txt', 'Error: ' + err.message)
    process.exit(1)
})
req.write(sqlPayload)
req.end()
