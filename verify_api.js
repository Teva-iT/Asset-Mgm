const fs = require('fs');

const BASE_URL = 'http://localhost:3000';

function log(msg) {
    try {
        fs.appendFileSync('verification.log', msg + '\n');
        console.log(msg);
    } catch (err) {
        console.error('Error writing to log:', err);
    }
}

async function verify() {
    // Clear log
    fs.writeFileSync('verification.log', '');

    log('Starting API Verification...');
    let cookie = '';

    // 1. Initial Check (Should be 401)
    try {
        log('1. Testing Unauthenticated Access to /api/employees (Expect 401)...');
        const res = await fetch(`${BASE_URL}/api/employees`);
        if (res.status === 401) {
            log('   [SUCCESS] correctly blocked (401).');
        } else {
            log(`   [FAILURE] expected 401, got ${res.status}`);
            const text = await res.text();
            // try to parse json if possible
            try {
                const json = JSON.parse(text);
                log(`   Response JSON: ${JSON.stringify(json)}`);
            } catch (e) {
                log(`   Response Text: ${text.substring(0, 100)}`);
            }
        }
    } catch (e) {
        log(`   [ERROR] Unauth check exception: ${e.message}`);
    }

    // 2. Login
    try {
        log('2. Testing Login...');
        const loginRes = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' }),
        });

        if (loginRes.status === 200) {
            log('   [SUCCESS] Login successful.');
            const setCookie = loginRes.headers.get('set-cookie');
            if (setCookie) {
                cookie = setCookie.split(';')[0];
                log('   [SUCCESS] Cookie received: ' + cookie.substring(0, 20) + '...');
            } else {
                log('   [FAILURE] No cookie received.');
            }
        } else {
            log(`   [FAILURE] Login failed: ${loginRes.status}`);
            return;
        }
    } catch (e) {
        log(`   [ERROR] Login exception: ${e.message}`);
        return;
    }

    const headers = {
        'Cookie': cookie
    };

    // 3. Get Employees (Authenticated)
    try {
        log('3. Testing Get Employees (Authenticated)...');
        const res = await fetch(`${BASE_URL}/api/employees`, { headers });
        if (res.status === 200) {
            const data = await res.json();
            log(`   [SUCCESS] Fetched ${data.length} employees.`);
        } else {
            log(`   [FAILURE] Get Employees failed: ${res.status}`);
        }
    } catch (e) {
        log(`   [ERROR] Get Employees exception: ${e.message}`);
    }

    log('Verification Complete.');
}

verify();
