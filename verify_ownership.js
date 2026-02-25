const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log('--- Starting Verification ---')

        // 1. Create Asset Types
        console.log('\n1. Creating Asset Types...')
        const laptopType = await prisma.assetType.upsert({
            where: { Name: 'Laptop Test' },
            update: { OwnershipType: 'Individual' },
            create: { Name: 'Laptop Test', OwnershipType: 'Individual' }
        })
        console.log('Created/Updated Laptop Test:', laptopType)

        const printerType = await prisma.assetType.upsert({
            where: { Name: 'Printer Test' },
            update: { OwnershipType: 'Shared' },
            create: { Name: 'Printer Test', OwnershipType: 'Shared' }
        })
        console.log('Created/Updated Printer Test:', printerType)

        const tonerType = await prisma.assetType.upsert({
            where: { Name: 'Toner Test' },
            update: { OwnershipType: 'Stock' },
            create: { Name: 'Toner Test', OwnershipType: 'Stock' }
        })
        console.log('Created/Updated Toner Test:', tonerType)

        // 2. Create Individual Asset (Laptop)
        console.log('\n2. Creating Individual Asset (Laptop)...')
        const laptop = await prisma.asset.create({
            data: {
                AssetName: 'LAP-001',
                AssetType: 'Laptop Test',
                OwnershipType: 'Individual',
                Status: 'Available',
                Quantity: 1
            }
        })
        console.log('Created Laptop:', laptop)

        // 3. Create Shared Asset (Printer)
        console.log('\n3. Creating Shared Asset (Printer)...')
        const printer = await prisma.asset.create({
            data: {
                AssetName: 'PRT-001',
                AssetType: 'Printer Test',
                OwnershipType: 'Shared',
                Location: 'Room 101',
                Status: 'Available', // Shared assets might be considered available or in use
                Quantity: 1
            }
        })
        console.log('Created Printer:', printer)

        // 4. Create Stock Asset (Toner)
        console.log('\n4. Creating Stock Asset (Toner)...')
        const toner = await prisma.asset.create({
            data: {
                AssetName: 'TNR-001',
                AssetType: 'Toner Test',
                OwnershipType: 'Stock',
                Quantity: 10,
                Status: 'In Stock'
            }
        })
        console.log('Created Toner:', toner)

        console.log('\n--- Verification Complete ---')

    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
