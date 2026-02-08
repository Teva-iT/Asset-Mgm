
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Connecting to DB...')
    try {
        const count = await prisma.assetType.count()
        console.log(`AssetType count: ${count}`)
        const types = await prisma.assetType.findMany()
        console.log('Types:', types)
    } catch (e) {
        console.error('Error querying AssetType:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
