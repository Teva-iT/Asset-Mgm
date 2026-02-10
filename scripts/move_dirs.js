
const fs = require('fs');
const path = require('path');

const srcCmdb = path.join(__dirname, '../app/cmdb');
const destCmdb = path.join(__dirname, '../app/inventory/cmdb');
const srcProc = path.join(__dirname, '../app/procurement');
const destProc = path.join(__dirname, '../app/inventory/procurement');

function moveDir(src, dest) {
    if (!fs.existsSync(src)) {
        console.log(`Source ${src} does not exist, skipping.`);
        return;
    }

    // Ensure parent dir exists
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) {
        fs.mkdirSync(parent, { recursive: true });
    }

    try {
        fs.renameSync(src, dest);
        console.log(`Moved ${src} to ${dest}`);
    } catch (err) {
        if (err.code === 'EXDEV' || err.code === 'EPERM') {
            // Cross-device link not permitted or permission error, copy and delete
            console.log(`Rename failed, trying copy-delete for ${src} -> ${dest}`);
            fs.cpSync(src, dest, { recursive: true });
            fs.rmSync(src, { recursive: true, force: true });
            console.log(`Copied and removed ${src} to ${dest}`);
        } else {
            console.error(`Error moving ${src}:`, err);
        }
    }
}

moveDir(srcCmdb, destCmdb);
moveDir(srcProc, destProc);
