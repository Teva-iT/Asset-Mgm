
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

function log(msg) {
    console.log(msg);
    fs.appendFileSync('debug_result.txt', msg + '\n');
}

async function main() {
    fs.writeFileSync('debug_result.txt', 'STARTING DEBUG\n');
    log('1. Attempting to connect to DB (JS)...');

    try {
        const count = await prisma.assetType.count();
        log(`2. Connection Successful. Current AssetType count: ${count}`);

        if (count === 0) {
            log('3. Table is empty.');
        } else {
            log('3. Table has data.');
            const samples = await prisma.assetType.findMany({ take: 3 });
            log('Samples: ' + JSON.stringify(samples));
        }
    } catch (e) {
        log('!!! ERROR !!!');
        log('Message: ' + e.message);
    } finally {
        await prisma.$disconnect();
        log('DONE');
    }
}

main();
