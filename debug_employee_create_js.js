
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    try {
        const body = {
            FirstName: "DebugJS",
            LastName: "UserJS",
            Email: `debug.js.${Date.now()}@example.com`,
            Department: "IT",
            StartDate: "2024-01-01"
        }

        console.log("Attempting to create employee with:", body)

        let baseSlug = `${body.FirstName}-${body.LastName}`.toLowerCase().replace(/[^a-z0-9-]/g, '')
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
        console.log("Generated slug:", slug)

        const employee = await prisma.employee.create({
            data: {
                FirstName: body.FirstName,
                LastName: body.LastName,
                Email: body.Email,
                Slug: slug,
                Department: body.Department,
                StartDate: new Date(body.StartDate),
            },
        })
        console.log("Employee created successfully:", employee)
    } catch (e) {
        console.error("Error creating employee:", e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
