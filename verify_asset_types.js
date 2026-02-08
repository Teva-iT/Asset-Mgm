const fetch = require('node-fetch'); // Ensure node-fetch is available or use native fetch in newer node

// Polyfill fetch if necessary (Node 18+ has native fetch)
const doFetch = global.fetch || require('node-fetch');

const BASE_URL = 'http://localhost:3000/api/asset-types';

async function verify() {
    console.log('1. Fetching initial types...');
    let res = await doFetch(BASE_URL);
    if (!res.ok) throw new Error(`GET failed: ${res.status}`);
    let data = await res.json();
    console.log(`   Fetched ${data.length} types.`);

    // Check for "Laptop"
    if (!data.some(t => t.Name === 'Laptop')) throw new Error('Default types not seeded!');

    console.log('2. Adding new type "VR Headset"...');
    res = await doFetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'VR Headset' })
    });
    if (!res.ok) throw new Error(`POST failed: ${res.status}`);
    const newType = await res.json();
    console.log('   Created:', newType);

    console.log('3. Verifying new type in list...');
    res = await doFetch(BASE_URL);
    data = await res.json();
    const found = data.find(t => t.Name === 'VR Headset');
    if (!found) throw new Error('New type not found in list!');
    console.log('   Success! Found VR Headset.');
}

verify().catch(err => {
    console.error('Verification Failed:', err);
    process.exit(1);
});
