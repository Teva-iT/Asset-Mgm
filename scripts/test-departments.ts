import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Fetching departments...')
        const departments = await prisma.department.findMany()
        console.log('Departments found:', departments.length)
        if (departments.length > 0) {
            console.log('First department:', departments[0])
        } else {
            console.log('No departments found.')
        }
    } catch (error) {
        console.error('Error fetching departments:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
