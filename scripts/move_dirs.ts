
import * as fs from 'fs';
import * as path from 'path';

const root = process.cwd();
console.log(`Root: ${root}`);

const moves = [
    { src: path.join(root, 'app', 'cmdb'), dest: path.join(root, 'app', 'inventory', 'cmdb') },
    { src: path.join(root, 'app', 'procurement'), dest: path.join(root, 'app', 'inventory', 'procurement') }
];

moves.forEach(({ src, dest }) => {
    console.log(`Processing: ${src} -> ${dest}`);

    if (!fs.existsSync(src)) {
        console.log(`Source missing: ${src}`);
        return;
    }

    const destParent = path.dirname(dest);
    if (!fs.existsSync(destParent)) {
        console.log(`Creating parent: ${destParent}`);
        fs.mkdirSync(destParent, { recursive: true });
    }

    try {
        console.log(`Attempting rename...`);
        fs.renameSync(src, dest);
        console.log(`Success: Renamed ${src} to ${dest}`);
    } catch (err: any) {
        console.log(`Rename failed: ${err.message}`);
        console.log(`Attempting copy-delete...`);
        try {
            fs.cpSync(src, dest, { recursive: true });
            console.log(`Copy success`);
            fs.rmSync(src, { recursive: true, force: true });
            console.log(`Delete success`);
        } catch (err2: any) {
            console.log(`Copy-delete failed: ${err2.message}`);
        }
    }
});
