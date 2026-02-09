const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
    const user = await prisma.user.findUnique({ where: { Username: 'Mahan' } })
    console.log(user ? 'User Exists' : 'User Not Found')
}
main().then(async () => await prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect() })
