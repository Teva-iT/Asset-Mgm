
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../move_log.txt');
function log(msg) {
    fs.appendFileSync(logFile, msg + '\n');
    console.log(msg);
}

const root = path.join(__dirname, '../');
log(`Root: ${root}`);

const moves = [
    { src: path.join(root, 'app/cmdb'), dest: path.join(root, 'app/inventory/cmdb') },
    { src: path.join(root, 'app/procurement'), dest: path.join(root, 'app/inventory/procurement') }
];

moves.forEach(({ src, dest }) => {
    log(`Processing: ${src} -> ${dest}`);

    if (!fs.existsSync(src)) {
        log(`Source missing: ${src}`);
        return;
    }

    // Create dest parent if needed
    const destParent = path.dirname(dest);
    if (!fs.existsSync(destParent)) {
        log(`Creating parent: ${destParent}`);
        fs.mkdirSync(destParent, { recursive: true });
    }

    try {
        log(`Attempting rename...`);
        fs.renameSync(src, dest);
        log(`Success: Renamed ${src} to ${dest}`);
    } catch (err) {
        log(`Rename failed: ${err.message}`);
        log(`Attempting copy-delete...`);
        try {
            fs.cpSync(src, dest, { recursive: true });
            log(`Copy success`);
            fs.rmSync(src, { recursive: true, force: true });
            log(`Delete success`);
        } catch (err2) {
            log(`Copy-delete failed: ${err2.message}`);
        }
    }
});
