
const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:2244@localhost:5432/asset_manager?schema=public',
});

async function main() {
    try {
        await client.connect();
        const res = await client.query('SELECT COUNT(*) FROM "StorageLocation"');
        console.log(`Storage Location Count: ${res.rows[0].count}`);

        if (parseInt(res.rows[0].count) > 0) {
            const items = await client.query('SELECT * FROM "StorageLocation" LIMIT 5');
            console.log('Sample locations:', items.rows);
        } else {
            console.log('No locations found.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

main();
