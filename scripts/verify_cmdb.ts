
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- DEBUG INFO ---')
    console.log('Environment DATABASE_URL:', process.env.DATABASE_URL)
    console.log('---')

    try {
        console.log('Checking Manufacturer table...')
        const count = await prisma.manufacturer.count()
        console.log(`Manufacturer table exists. Count: ${count}`)

        console.log('Checking AssetModel table...')
        const modelCount = await prisma.assetModel.count()
        console.log(`AssetModel table exists. Count: ${modelCount}`)

        console.log('Verification successful.')
    } catch (e) {
        console.error('Verification failed:', e)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
