require('dotenv').config()
const { Client } = require('pg')

async function listTables() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    })
    try {
        await client.connect()
        const res = await client.query(`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';`)
        console.log("Tables:")
        console.log(res.rows.map(r => r.tablename).join(', '))
    } catch (err) {
        console.error("Error:", err)
    } finally {
        await client.end()
    }
}
listTables()
