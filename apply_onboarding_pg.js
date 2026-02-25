require('dotenv').config()
const { Client } = require('pg')
const fs = require('fs')

async function runSQL() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    })
    try {
        await client.connect()
        console.log("Connected to DB.")
        const sql = fs.readFileSync('supabase/migrations/20260220234500_add_onboarding_process.sql', 'utf8')
        await client.query(sql)
        console.log("Onboarding schema applied successfully.")
    } catch (err) {
        console.error("Error executing SQL:", err)
    } finally {
        await client.end()
    }
}
runSQL()
