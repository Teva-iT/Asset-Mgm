
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding ...')

    // 1. Create Manufacturers
    const apple = await prisma.manufacturer.upsert({
        where: { Name: 'Apple' },
        update: {},
        create: {
            Name: 'Apple',
            Website: 'https://apple.com',
            SupportPhone: '1-800-MY-APPLE',
        },
    })

    const dell = await prisma.manufacturer.upsert({
        where: { Name: 'Dell' },
        update: {},
        create: {
            Name: 'Dell',
            Website: 'https://dell.com',
            SupportEmail: 'support@dell.com',
        },
    })

    console.log('Manufacturers created:', apple.Name, dell.Name)

    // 2. Create Asset Models
    const mbp16 = await prisma.assetModel.create({
        data: {
            Name: 'MacBook Pro 16-inch (M3 Max)',
            ModelNumber: 'A2991',
            Category: 'Laptop',
            ManufacturerID: apple.ManufacturerID,
            Description: 'High-performance laptop for developers',
            ImageURL: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp16-spaceblack-select-202310',
        },
    })

    const latitude = await prisma.assetModel.create({
        data: {
            Name: 'Latitude 5520',
            ModelNumber: 'L5520',
            Category: 'Laptop',
            ManufacturerID: dell.ManufacturerID,
            Description: 'Standard business laptop',
        },
    })

    console.log('Models created:', mbp16.Name, latitude.Name)

    // 3. Create Assets
    // Device 1: Apple - Assigned
    await prisma.asset.create({
        data: {
            ModelID: mbp16.ModelID,
            SerialNumber: 'C02XYZ123',
            AssetTag: 'IT-2024-001',
            DeviceTag: 'IT-2024-001', // Sync legacy
            Status: 'Assigned',
            Condition: 'New',
            AssetName: 'CTO MacBook',
        },
    })

    // Device 2: Apple - Available
    await prisma.asset.create({
        data: {
            ModelID: mbp16.ModelID,
            SerialNumber: 'C02ABC789',
            AssetTag: 'IT-2024-002',
            DeviceTag: 'IT-2024-002',
            Status: 'Available',
            Condition: 'New',
        },
    })

    // Device 3: Dell - In Stock
    await prisma.asset.create({
        data: {
            ModelID: latitude.ModelID,
            SerialNumber: 'DL-5520-001',
            AssetTag: 'IT-2024-003',
            DeviceTag: 'IT-2024-003',
            Status: 'In Stock',
            Condition: 'Used (Good)',
        },
    })

    console.log('Assets created.')
    console.log('Seeding finished.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
