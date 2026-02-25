const fs = require('fs');

const BASE_URL = 'http://localhost:3000';

function log(msg) {
    try {
        fs.appendFileSync('verification_refactor.log', msg + '\n');
        console.log(msg);
    } catch (err) {
        console.error('Error writing to log:', err);
    }
}

async function verify() {
    fs.writeFileSync('verification_refactor.log', '');
    log('Starting Phase 4 API Verification...');

    // 0. Login to get cookie (needed for everything now due to middleware)
    let cookie = '';
    try {
        log('0. Authenticating...');
        const loginRes = await fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' }),
        });
        if (loginRes.ok) {
            cookie = loginRes.headers.get('set-cookie').split(';')[0];
            log('   [SUCCESS] Authenticated.');
        } else {
            log('   [FAILURE] Login failed.');
            return;
        }
    } catch (e) {
        log('   [ERROR] Login failed: ' + e.message);
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Cookie': cookie
    };

    let employeeId = '';

    // 1. Create Employee (to ensure we have one)
    try {
        log('1. Creating Test Employee...');
        const res = await fetch(`${BASE_URL}/api/employees`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                FirstName: 'Refactor',
                LastName: 'TestUser',
                Email: 'refactor@test.com',
                Department: 'QA',
                StartDate: '2023-01-01'
            })
        });
        if (res.ok) {
            const emp = await res.json();
            employeeId = emp.EmployeeID;
            log(`   [SUCCESS] Created Employee: ${emp.FirstName} ${emp.LastName} (${emp.EmployeeID})`);
        } else {
            log(`   [FAILURE] Create Employee failed: ${res.status}`);
        }
    } catch (e) {
        log(`   [ERROR] Create Employee exception: ${e.message}`);
    }

    // 2. Test Search API
    try {
        log('2. Testing Employee Search (q=Refactor)...');
        const res = await fetch(`${BASE_URL}/api/employees?q=Refactor`, { headers });
        if (res.ok) {
            const data = await res.json();
            if (data.length > 0 && data[0].FirstName === 'Refactor') {
                log(`   [SUCCESS] Found ${data.length} matches.`);
            } else {
                log(`   [FAILURE] Search returned unexpected data: ${JSON.stringify(data)}`);
            }
        } else {
            log(`   [FAILURE] Search failed: ${res.status}`);
        }
    } catch (e) {
        log(`   [ERROR] Search exception: ${e.message}`);
    }

    // 3. Test Transactional Assign
    if (employeeId) {
        try {
            log('3. Testing Asset Creation with Assignment...');
            const payload = {
                AssetType: 'Laptop',
                AssetName: 'Transactional Laptop',
                Brand: 'TestBrand',
                Model: 'X1',
                SerialNumber: 'TRANS-001',
                Status: 'Available', // Should get overridden
                PurchaseDate: '2023-01-01',
                assignment: {
                    employeeId: employeeId,
                    assignedDate: '2023-10-27',
                    expectedReturnDate: '2023-11-27'
                }
            };

            const res = await fetch(`${BASE_URL}/api/assets`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const asset = await res.json();
                log(`   [SUCCESS] Created Asset: ${asset.AssetName}`);
                log(`   Asset Status: ${asset.Status}`);
                if (asset.Status === 'Assigned') {
                    log('   [CHECK] Status is correctly "Assigned".');
                } else {
                    log('   [FAILURE] Status should be "Assigned"!');
                }
            } else {
                const txt = await res.text();
                log(`   [FAILURE] Create Asset failed: ${res.status} - ${txt}`);
            }
        } catch (e) {
            log(`   [ERROR] Asset Create exception: ${e.message}`);
        }
    }

    log('Verification Refactor Complete.');
}

verify();
