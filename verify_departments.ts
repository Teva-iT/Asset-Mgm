
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const count = await prisma.department.count()
    console.log(`Department Count: ${count}`)
    const depts = await prisma.department.findMany({ take: 5 })
    console.log('Sample Departments:', depts.map(d => d.Name))
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
