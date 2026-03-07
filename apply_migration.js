require('dotenv').config()
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function applyMigration() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    })

    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20260306220800_update_inventory_record_fk.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    console.log("Applying migration from:", migrationPath)

    try {
        await client.connect()
        await client.query(sql)
        console.log("Migration applied successfully.")
    } catch (err) {
        console.error("Error applying migration:", err)
        process.exit(1)
    } finally {
        await client.end()
    }
}

applyMigration()
