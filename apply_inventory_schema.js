require('dotenv').config()
const { Client } = require('pg')
const fs = require('fs')

async function runSQL() {
    console.log("Using Database URL:", process.env.DATABASE_URL);
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    })
    try {
        await client.connect()
        console.log("Connected to DB.")
        const sql = fs.readFileSync('create_inventory_schema.sql', 'utf8')
        await client.query(sql)
        console.log("Inventory schema applied successfully.")
    } catch (err) {
        console.error("Error executing SQL:", err)
    } finally {
        await client.end()
    }
}
runSQL()
