
import { prisma } from './lib/db'

async function checkEmployees() {
    try {
        console.log('Connecting to DB...')
        const count = await prisma.employee.count()
        console.log(`Total Employees: ${count}`)

        if (count > 0) {
            const employees = await prisma.employee.findMany({ take: 5 })
            console.log('Sample Employees:', JSON.stringify(employees, null, 2))
        } else {
            console.log('No employees found in DB.')
        }
    } catch (error) {
        console.error('Error querying employees:', error)
    } finally {
        await prisma.$disconnect()
        process.exit(0)
    }
}

// Timeout
setTimeout(() => {
    console.error('Timeout reached, exiting...')
    process.exit(1)
}, 5000)

checkEmployees()
