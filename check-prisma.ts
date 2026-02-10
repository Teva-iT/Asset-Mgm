
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Checking Prism Client...')
    if ('auditLog' in prisma) {
        console.log('SUCCESS: auditLog model found on Prisma Client.')
    } else {
        console.error('FAILURE: auditLog model NOT found on Prisma Client.')
        process.exit(1)
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
