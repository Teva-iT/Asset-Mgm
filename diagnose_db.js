
const { Client } = require('pg');

const databaseUrl = 'postgresql://postgres:2244@localhost:5432/asset_manager?schema=public';

async function diagnose() {
    console.log('--- Database Diagnostic ---');
    console.log(`Connection String: ${databaseUrl.replace(/:[^:@]+@/, ':***@')}`);

    const client = new Client({
        connectionString: databaseUrl,
    });

    try {
        await client.connect();
        console.log('✅ Connection Successful!');

        // Check databases
        const res = await client.query("SELECT datname FROM pg_database WHERE datname='asset_manager'");
        if (res.rows.length > 0) {
            console.log("✅ Database 'asset_manager' exists.");
        } else {
            console.error("❌ Database 'asset_manager' DOES NOT EXIST.");
        }

        // Check schema
        const schemaRes = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'public'");
        if (schemaRes.rows.length > 0) {
            console.log("✅ Schema 'public' exists.");
        } else {
            console.error("❌ Schema 'public' missing.");
        }

        // List ALL tables
        console.log('\n--- Listing All Tables in public schema ---');
        const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

        if (tableRes.rows.length === 0) {
            console.log('⚠️ No tables found in public schema.');
        } else {
            tableRes.rows.forEach(row => {
                console.log(`- ${row.table_name}`);
            });
        }

        // Check specifically for StorageLocation
        const storageLocRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'StorageLocation'
    `);

        if (storageLocRes.rows.length > 0) {
            console.log("\n✅ 'StorageLocation' table FOUND.");
        } else {
            // Check case sensitivity issue
            const storageLocResLower = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND lower(table_name) = 'storagelocation'
        `);
            if (storageLocResLower.rows.length > 0) {
                console.log(`\n⚠️ 'StorageLocation' table FOUND BUT with name: ${storageLocResLower.rows[0].table_name}`);
            } else {
                console.error("\n❌ 'StorageLocation' table MISSING.");
            }
        }

    } catch (err) {
        console.error('❌ Connection Error:', err.message);
        if (err.code) console.error('Error Code:', err.code);
    } finally {
        await client.end();
    }
}

diagnose();
