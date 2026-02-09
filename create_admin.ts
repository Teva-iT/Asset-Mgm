import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = await hash('2244', 12)
    const user = await prisma.user.upsert({
        where: { Username: 'Mahan' },
        update: {},
        create: {
            Username: 'Mahan',
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
