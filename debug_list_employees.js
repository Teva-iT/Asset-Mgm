
console.log("Script starting...")
const { PrismaClient } = require('@prisma/client')
console.log("PrismaClient required")
const prisma = new PrismaClient()
console.log("PrismaClient instantiated")

async function main() {
    try {
        console.log("Connecting to DB...")
        const employees = await prisma.employee.findMany()
        console.log("Employees found:", employees.length)
        console.log(JSON.stringify(employees, null, 2))
    } catch (e) {
        console.error("Error listing employees:", e)
    } finally {
        await prisma.$disconnect()
    }
}
main().catch(e => console.error("Top level error:", e))
