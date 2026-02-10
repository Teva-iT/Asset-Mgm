
const fs = require('fs');
const path = require('path');

const root = process.cwd();
console.log('Current working directory:', root);

const srcCmdb = path.join(root, 'app', 'cmdb');
const destCmdb = path.join(root, 'app', 'inventory', 'cmdb');
const srcProc = path.join(root, 'app', 'procurement');
const destProc = path.join(root, 'app', 'inventory', 'procurement');

console.log('Source CMDB:', srcCmdb);
console.log('Dest CMDB:', destCmdb);

function moveDir(src, dest) {
    if (!fs.existsSync(src)) {
        console.log(`Source ${src} does not exist, skipping.`);
        return;
    }

    // Ensure parent dir exists
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) {
        console.log(`Creating parent dir: ${parent}`);
        fs.mkdirSync(parent, { recursive: true });
    }

    try {
        console.log(`Attempting rename...`);
        fs.renameSync(src, dest);
        console.log(`Moved ${src} to ${dest}`);
    } catch (err) {
        console.log(`Rename failed: ${err.message}. Trying copy-delete...`);
        try {
            fs.cpSync(src, dest, { recursive: true });
            fs.rmSync(src, { recursive: true, force: true });
            console.log(`Copied and removed ${src} to ${dest}`);
        } catch (copyErr) {
            console.error(`Copy-delete failed for ${src}:`, copyErr);
        }
    }
}

moveDir(srcCmdb, destCmdb);
moveDir(srcProc, destProc);
