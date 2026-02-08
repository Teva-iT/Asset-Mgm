const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    const password = await hash('admin123', 12)
    const user = await prisma.user.upsert({
        where: { Username: 'admin' },
        update: {},
        create: {
            Username: 'admin',
            Password: password,
            Role: 'ADMIN',
        },
    })
    console.log({ user })
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
