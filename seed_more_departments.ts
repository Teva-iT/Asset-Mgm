import { prisma } from './lib/db'

async function seedMore() {
    const departments = [
        'Administrative',
        'Business Development',
        'Customer Service',
        'Engineering',
        'Legal',
        'Logistics',
        'Product Management',
        'Production',
        'Procurement',
        'Quality Assurance',
        'R&D',
        'Sales',
        'Security',
        'Support',
        'Training',
        'Warehouse',
        'Facilities'
    ]

    console.log('Seeding more departments...')

    for (const name of departments) {
        const existing = await prisma.department.findUnique({
            where: { Name: name }
        })

        if (!existing) {
            await prisma.department.create({
                data: { Name: name }
            })
            console.log(`Created: ${name}`)
        } else {
            console.log(`Exists: ${name}`)
        }
    }

    console.log('Seeding complete.')
}

seedMore()
