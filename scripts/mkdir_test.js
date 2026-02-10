
const fs = require('fs');
const path = require('path');
const dirs = ['app/inventory/cmdb', 'app/inventory/procurement'];
dirs.forEach(d => {
    const p = path.join(process.cwd(), d);
    try {
        fs.mkdirSync(p, { recursive: true });
        fs.writeFileSync(path.join(p, 'test_create.txt'), 'created');
        console.log(`Created ${p}`);
    } catch (e) {
        console.error(`Failed ${p}:`, e);
    }
});
