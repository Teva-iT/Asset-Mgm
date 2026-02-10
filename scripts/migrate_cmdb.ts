
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
    console.log('Starting CMDB Migration...');

    // 1. Fetch all assets
    const assets = await prisma.asset.findMany({
        where: {
            ModelID: null, // Only migrate those not yet linked
            Brand: { not: null },
            Model: { not: null }
        }
    });

    console.log(`Found ${assets.length} assets to migrate.`);

    for (const asset of assets) {
        if (!asset.Brand || !asset.Model) continue;

        // 2. Identify or Create Manufacturer
        let manufacturer = await prisma.manufacturer.findUnique({
            where: { Name: asset.Brand }
        });

        if (!manufacturer) {
            console.log(`Creating Manufacturer: ${asset.Brand}`);
            manufacturer = await prisma.manufacturer.create({
                data: { Name: asset.Brand }
            });
        }

        // 3. Identify or Create AssetModel
        // We assume Model Name is unique per Manufacturer mostly, but let's check global uniqueness or unique by manufacturer
        // Schema has ModelID as UUID, but we need to find by Name.
        // Let's search by Name AND ManufacturerID to be safe, though Schema doesn't enforce unique Name+Manufacturer yet (it should ideally)

        // For now, let's just try to find a model with this name and manufacturer
        let model = await prisma.assetModel.findFirst({
            where: {
                Name: asset.Model,
                ManufacturerID: manufacturer.ManufacturerID
            }
        });

        if (!model) {
            console.log(`Creating Model: ${asset.Model} (${asset.AssetType})`);
            model = await prisma.assetModel.create({
                data: {
                    Name: asset.Model,
                    ManufacturerID: manufacturer.ManufacturerID,
                    Category: asset.AssetType || 'Uncategorized',
                }
            });
        }

        // 4. Update Asset with ModelID
        await prisma.asset.update({
            where: { AssetID: asset.AssetID },
            data: {
                ModelID: model.ModelID
            }
        });

        process.stdout.write('.');
    }

    console.log('\nMigration Complete.');
}

migrate()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
