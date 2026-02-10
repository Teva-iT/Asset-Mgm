
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const departments = [
        'IT',
        'Human Resources',
        'Engineering',
        'Sales',
        'Marketing',
        'Finance',
        'Operations',
        'Legal',
        'Management',
        'Product',
        'Customer Support',
        'Research & Development',
        'Administration'
    ]

    console.log('Seeding departments...')

    for (const name of departments) {
        // Upsert to avoid duplicates if some exist
        // Since Name is not unique in schema (wait, checking schema)
        // Schema: Name String (no @unique in Step 1919, line 99)
        // But typically we want unique names.
        // Let's check if it exists first.

        const existing = await prisma.department.findFirst({
            where: { Name: name }
        })

        if (!existing) {
            await prisma.department.create({
                data: {
                    Name: name
                }
            })
            console.log(`Created: ${name}`)
        } else {
            console.log(`Skipped (exists): ${name}`)
        }
    }

    console.log('Done.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
