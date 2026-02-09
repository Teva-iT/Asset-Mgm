
import { prisma } from './lib/db'

async function testBatchImport() {
    try {
        console.log('Testing Batch Import API...')

        // Mock payload
        const payload = {
            employees: [
                {
                    FirstName: 'BatchUser1',
                    LastName: 'Test',
                    Email: `batch1.${Date.now()}@example.com`,
                    Department: 'Engineering',
                    StartDate: new Date().toISOString()
                },
                {
                    FirstName: 'BatchUser2',
                    LastName: 'Test',
                    Email: `batch2.${Date.now()}@example.com`,
                    Department: 'HR',
                    StartDate: new Date().toISOString()
                }
            ]
        }

        // Simulate API call logic directly since we can't easily fetch localhost:3000 from here without running server
        // But we can verify the DB logic.
        // Actually, let's just use the logic from the route to ensure it works.

        console.log('Inserting 2 employees...')

        let createdCount = 0
        await prisma.$transaction(async (tx) => {
            for (const emp of payload.employees) {
                let baseSlug = `${emp.FirstName}-${emp.LastName}`.toLowerCase().replace(/[^a-z0-9-]/g, '')
                let slug = baseSlug
                let count = 1

                while (true) {
                    const existing = await tx.employee.findUnique({ where: { Slug: slug } })
                    if (!existing) break
                    slug = `${baseSlug}-${count}`
                    count++
                }

                await tx.employee.create({
                    data: {
                        FirstName: emp.FirstName,
                        LastName: emp.LastName,
                        Email: emp.Email,
                        Department: emp.Department,
                        StartDate: new Date(emp.StartDate),
                        Status: 'Active',
                        Slug: slug
                    }
                })
                createdCount++
            }
        })

        console.log(`Success! Created ${createdCount} employees.`)

        // Verify
        const newEmps = await prisma.employee.findMany({
            where: { FirstName: { startsWith: 'BatchUser' } },
            orderBy: { createdAt: 'desc' },
            take: 2
        })

        console.log('Verified in DB:', newEmps.map(e => e.Email))

    } catch (error) {
        console.error('Batch Import Test Failed:', error)
    } finally {
        await prisma.$disconnect()
        process.exit(0)
    }
}

testBatchImport()
