import { prisma } from './lib/db'

async function seed() {
    const departments = ['IT', 'HR', 'Operations', 'Finance', 'Marketing']

    console.log('Seeding departments...')

    for (const name of departments) {
        const existing = await prisma.department.findUnique({
            where: { Name: name }
        })

        if (!existing) {
            await prisma.department.create({
                data: { Name: name }
            })
            console.log(`Created department: ${name}`)
        } else {
            console.log(`Department already exists: ${name}`)
        }
    }

    console.log('Seeding complete.')
}

seed()
