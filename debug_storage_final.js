
const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:2244@localhost:5432/asset_manager?schema=public',
});

async function main() {
    try {
        await client.connect();
        console.log("Connected to DB");

        // List all tables
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log("Tables found:", tables.rows.map(r => r.table_name));

        // Check specifically for StorageLocation (case sensitive)
        try {
            const count = await client.query('SELECT count(*) FROM "StorageLocation"');
            console.log('Count in "StorageLocation":', count.rows[0].count);
            const rows = await client.query('SELECT * FROM "StorageLocation" LIMIT 3');
            console.log('Rows:', rows.rows);
        } catch (e) {
            console.log('Error querying "StorageLocation":', e.message);
        }

    } catch (e) {
        console.error("Connection error:", e);
    } finally {
        await client.end();
    }
}

main();
