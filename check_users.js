const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    try {
        console.log('Connecting to database...')
        const users = await prisma.user.findMany()
        console.log('Users found in DB:', users.length)
        console.log(JSON.stringify(users, null, 2))
    } catch (e) {
        console.error('Error fetching users:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
