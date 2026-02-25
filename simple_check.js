
const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgresql://postgres:2244@localhost:5432/asset_manager?schema=public',
    connectionTimeoutMillis: 2000,
});

console.log('Attempting to connect...');

client.connect()
    .then(() => {
        console.log('Connected!');
        return client.query('SELECT table_name FROM information_schema.tables WHERE table_name = \'StorageLocation\'');
    })
    .then(res => {
        console.log('Query result:', res.rows);
        client.end();
        process.exit(0);
    })
    .catch(err => {
        console.error('Connection/Query Error:', err);
        process.exit(1);
    });
