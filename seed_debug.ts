
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
})

async function main() {
    console.log('1. Attempting to connect to DB...')

    try {
        const count = await prisma.assetType.count()
        console.log(`2. Connection Successful. Current AssetType count: ${count}`)

        if (count === 0) {
            console.log('3. Table is empty. Attempting to seed...')
            const types = [
                'Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse',
                'Printer', 'Scanner', 'Headset', 'Webcam', 'Other'
            ]
            await prisma.assetType.createMany({
                data: types.map(name => ({ Name: name })),
                skipDuplicates: true
            })
            console.log('4. Seeding complete.')
        } else {
            console.log('3. Table has data. Fetching samples...')
            const samples = await prisma.assetType.findMany({ take: 3 })
            console.log('Samples:', samples)
        }
    } catch (e: any) {
        console.error('!!! ERROR !!!')
        console.error('Type:', e.constructor.name)
        console.error('Message:', e.message)
        console.error('Code:', e.code)
        if (e.meta) console.error('Meta:', e.meta)
    } finally {
        await prisma.$disconnect()
    }
}

main()
