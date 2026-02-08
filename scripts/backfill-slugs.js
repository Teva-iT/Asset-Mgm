const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const employees = await prisma.employee.findMany({
        where: { Slug: null }
    })

    console.log(`Found ${employees.length} employees without slugs.`)

    for (const emp of employees) {
        let baseSlug = `${emp.FirstName}-${emp.LastName}`.toLowerCase().replace(/[^a-z0-9-]/g, '')
        let slug = baseSlug
        let count = 1

        while (true) {
            const existing = await prisma.employee.findUnique({
                where: { Slug: slug }
            })
            if (!existing) break
            slug = `${baseSlug}-${count}`
            count++
        }

        await prisma.employee.update({
            where: { EmployeeID: emp.EmployeeID },
            data: { Slug: slug }
        })
        console.log(`Updated ${emp.FirstName} ${emp.LastName} -> ${slug}`)
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
